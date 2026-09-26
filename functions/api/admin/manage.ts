import { getSecret, getSessionUser, hasD1, hashPassword } from "../../lib/auth";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function requireAdmin(request: Request, env: any) {
  const secret = getSecret(env);
  if (!secret || !hasD1(env)) return null;
  const user = await getSessionUser(request, secret);
  if (!user || user.role !== "admin") return null;
  return user;
}

// POST /api/admin/manage
//   { action: "reset",  id, newPassword }   重置某人密码
//   { action: "delete", id }                删除某人（连带其歌单/收藏）
//   { action: "role",   id, role }          改角色 user/admin
export async function onRequestPost(context: any) {
  const { request, env } = context;
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: "forbidden" }, 403);

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";
  const id = Number(body.id);
  if (!id || Number.isNaN(id)) return json({ error: "invalid_id" }, 400);

  const target = await env.DB.prepare("SELECT id, username, role FROM users WHERE id = ?1")
    .bind(id)
    .first();
  if (!target) return json({ error: "user_not_found" }, 404);

  if (action === "reset") {
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (newPassword.length < 4) return json({ error: "weak_password" }, 400);
    const { salt, hash } = await hashPassword(newPassword);
    await env.DB.prepare("UPDATE users SET salt = ?1, hash = ?2 WHERE id = ?3")
      .bind(salt, hash, id)
      .run();
    return json({ success: true });
  }

  if (action === "delete") {
    if (id === admin.uid) return json({ error: "cannot_delete_self" }, 400);
    // 不允许删除最后一个管理员
    if (String((target as any).role) === "admin") {
      const adminCountRow = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"
      ).first();
      if (Number((adminCountRow as any).n) <= 1) {
        return json({ error: "cannot_delete_last_admin" }, 400);
      }
    }
    await env.DB.batch([
      env.DB.prepare("DELETE FROM playback_store_v2 WHERE user_id = ?1").bind(id),
      env.DB.prepare("DELETE FROM favorites_store_v2 WHERE user_id = ?1").bind(id),
      env.DB.prepare("DELETE FROM users WHERE id = ?1").bind(id),
    ]);
    return json({ success: true });
  }

  if (action === "role") {
    const role = body.role === "admin" ? "admin" : "user";
    // 防止把最后一个管理员降级
    if (role === "user" && String((target as any).role) === "admin") {
      const adminCountRow = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"
      ).first();
      if (Number((adminCountRow as any).n) <= 1) {
        return json({ error: "cannot_demote_last_admin" }, 400);
      }
    }
    await env.DB.prepare("UPDATE users SET role = ?1 WHERE id = ?2").bind(role, id).run();
    return json({ success: true });
  }

  return json({ error: "unknown_action" }, 400);
}
