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
    // 用条件删除代替「先 COUNT 再删」：并发下也不会把最后一个管理员删掉
    const deleted = await env.DB.prepare(
      "DELETE FROM users WHERE id = ?1 AND (role <> 'admin' OR (SELECT COUNT(*) FROM users WHERE role = 'admin') > 1)"
    )
      .bind(id)
      .run();
    if (Number((deleted as any).meta?.changes ?? 0) === 0) {
      const exists = await env.DB.prepare("SELECT id FROM users WHERE id = ?1").bind(id).first();
      if (!exists) return json({ error: "user_not_found" }, 404);
      return json({ error: "cannot_delete_last_admin" }, 400);
    }
    await env.DB.batch([
      env.DB.prepare("DELETE FROM playback_store_v2 WHERE user_id = ?1").bind(id),
      env.DB.prepare("DELETE FROM favorites_store_v2 WHERE user_id = ?1").bind(id),
    ]);
    return json({ success: true });
  }

  if (action === "role") {
    const role = body.role === "admin" ? "admin" : "user";
    // 同上：降级操作带条件，防止并发下把最后一个管理员降成普通用户
    const updated = await env.DB.prepare(
      "UPDATE users SET role = ?1 WHERE id = ?2 AND (?1 = 'admin' OR role <> 'admin' OR (SELECT COUNT(*) FROM users WHERE role = 'admin') > 1)"
    )
      .bind(role, id)
      .run();
    if (Number((updated as any).meta?.changes ?? 0) === 0) {
      // 没改到行有三种原因，别一律报"最后一个管理员"
      const exists = await env.DB.prepare("SELECT id FROM users WHERE id = ?1").bind(id).first();
      if (!exists) return json({ error: "user_not_found" }, 404);
      if (role === "user") return json({ error: "cannot_demote_last_admin" }, 400);
      // 本来就是 admin：幂等返回成功
    }
    return json({ success: true });
  }

  return json({ error: "unknown_action" }, 400);
}
