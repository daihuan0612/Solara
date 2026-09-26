import { getSecret, getSessionUser, hasD1, hashPassword, verifyPassword } from "../lib/auth";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// 普通用户修改自己的密码：{ oldPassword, newPassword }
export async function onRequestPost(context: any) {
  const { request, env } = context;
  const secret = getSecret(env);

  if (!secret || !hasD1(env)) {
    return json({ success: false, error: "not_supported" }, 400);
  }

  const user = await getSessionUser(request, secret);
  if (!user) {
    return json({ success: false, error: "unauthorized" }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const oldPassword = typeof body.oldPassword === "string" ? body.oldPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 4) {
    return json({ success: false, error: "weak_password" }, 400);
  }

  const row = await env.DB.prepare("SELECT id, salt, hash FROM users WHERE id = ?1")
    .bind(user.uid)
    .first();
  if (!row) {
    return json({ success: false, error: "user_not_found" }, 404);
  }

  const ok = await verifyPassword(oldPassword, (row as any).salt, (row as any).hash);
  if (!ok) {
    return json({ success: false, error: "wrong_old_password" }, 400);
  }

  const { salt, hash } = await hashPassword(newPassword);
  await env.DB.prepare("UPDATE users SET salt = ?1, hash = ?2 WHERE id = ?3")
    .bind(salt, hash, user.uid)
    .run();

  return json({ success: true });
}
