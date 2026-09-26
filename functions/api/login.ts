import {
  createSessionCookie,
  getSecret,
  hasD1,
  seedAdminIfEmpty,
  verifyPassword,
} from "../lib/auth";

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const isHttps = url.protocol === "https:";
  const secret = getSecret(env);

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  // 未启用鉴权（开放模式）
  if (!secret) {
    return json({ success: true, role: "user" });
  }

  // 无 D1 时退回「单总密码」兼容模式：任意用户名 + 正确 PASSWORD 即以管理员身份进入
  if (!hasD1(env)) {
    if (typeof env.PASSWORD === "string" && password === env.PASSWORD) {
      const cookie = await createSessionCookie(
        { uid: 0, name: username || "admin", role: "admin" },
        secret,
        isHttps
      );
      return json({ success: true, role: "admin" }, 200, { "Set-Cookie": cookie });
    }
    return json({ success: false, error: "invalid_credentials" }, 401);
  }

  // 多用户模式（D1）
  await seedAdminIfEmpty(env);

  if (!username || !password) {
    return json({ success: false, error: "missing_fields" }, 400);
  }

  const row = await env.DB.prepare(
    "SELECT id, username, salt, hash, role FROM users WHERE username = ?1"
  )
    .bind(username)
    .first();

  if (!row) {
    return json({ success: false, error: "invalid_credentials" }, 401);
  }

  const ok = await verifyPassword(password, (row as any).salt, (row as any).hash);
  if (!ok) {
    return json({ success: false, error: "invalid_credentials" }, 401);
  }

  const cookie = await createSessionCookie(
    { uid: Number((row as any).id), name: String((row as any).username), role: String((row as any).role || "user") },
    secret,
    isHttps
  );
  return json({ success: true, role: String((row as any).role || "user") }, 200, {
    "Set-Cookie": cookie,
  });
}
