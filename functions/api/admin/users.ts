import {
  getSecret,
  getSessionUser,
  hasD1,
  hashPassword,
  seedAdminIfEmpty,
} from "../../lib/auth";

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

// GET  /api/admin/users        列出所有账号（不含密码哈希）
// POST /api/admin/users        新建账号 { username, password, role? }
export async function onRequest(context: any) {
  const { request, env } = context;
  const method = (request.method || "GET").toUpperCase();

  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: "forbidden" }, 403);

  await seedAdminIfEmpty(env);

  if (method === "GET") {
    const result = await env.DB.prepare(
      "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
    ).all();
    const rows = (result as any).results || [];
    return json({ users: rows });
  }

  if (method === "POST") {
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "admin" ? "admin" : "user";

    if (!username || username.length > 40 || !/^[\w.\-@]+$/.test(username)) {
      return json({ error: "invalid_username" }, 400);
    }
    if (password.length < 4) {
      return json({ error: "weak_password" }, 400);
    }

    const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ?1")
      .bind(username)
      .first();
    if (exists) {
      return json({ error: "username_taken" }, 409);
    }

    const { salt, hash } = await hashPassword(password);
    const inserted = await env.DB.prepare(
      "INSERT INTO users (username, salt, hash, role) VALUES (?1, ?2, ?3, ?4)"
    )
      .bind(username, salt, hash, role)
      .run();
    const id = Number((inserted as any).meta?.last_row_id || 0);
    return json({ success: true, user: { id, username, role } }, 201);
  }

  return json({ error: "method_not_allowed" }, 405);
}
