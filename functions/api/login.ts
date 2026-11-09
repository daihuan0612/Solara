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

// 登录失败限速：同一 IP+账号 10 分钟内最多错 10 次。
// 只存在当前 isolate 内存里（Workers 无法跨实例共享），挡的是同一入口的连续爆破，
// 每次尝试要跑 10 万轮 PBKDF2，刷这个接口本来就能白耗 CPU。
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_FAILS = 10;
const loginFailures = new Map<string, { count: number; resetAt: number }>();

function loginBucketKey(request: Request, username: string): string {
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";
  return `${ip}|${username}`;
}

function isLoginBlocked(key: string): boolean {
  const entry = loginFailures.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    loginFailures.delete(key);
    return false;
  }
  return entry.count >= LOGIN_MAX_FAILS;
}

function noteLoginFailure(key: string): void {
  // 超量时淘汰最旧的一批，绝不整表清空 —— clear() 会被人用大量假账号
  // 刷到 5000 条来重置限速，等于限速形同虚设。
  if (loginFailures.size > 5000) {
    let removed = 0;
    for (const oldest of loginFailures.keys()) {
      loginFailures.delete(oldest);
      if (++removed >= 500) break;
    }
  }
  const now = Date.now();
  const entry = loginFailures.get(key);
  if (!entry || now > entry.resetAt) {
    loginFailures.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  // 先删再插：Map 按插入序淘汰，热 key 不刷新位置会被提前驱逐
  loginFailures.delete(key);
  loginFailures.set(key, { count: entry.count + 1, resetAt: entry.resetAt });
}

function clearLoginFailures(key: string): void {
  loginFailures.delete(key);
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

  const bucket = loginBucketKey(request, username);
  if (isLoginBlocked(bucket)) {
    return json({ success: false, error: "too_many_attempts" }, 429);
  }

  // 无 D1 时退回「单总密码」兼容模式：任意用户名 + 正确 PASSWORD 即以管理员身份进入
  if (!hasD1(env)) {
    if (typeof env.PASSWORD === "string" && password === env.PASSWORD) {
      clearLoginFailures(bucket);
      const cookie = await createSessionCookie(
        { uid: 0, name: username || "admin", role: "admin" },
        secret,
        isHttps
      );
      return json({ success: true, role: "admin" }, 200, { "Set-Cookie": cookie });
    }
    noteLoginFailure(bucket);
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
    noteLoginFailure(bucket);
    return json({ success: false, error: "invalid_credentials" }, 401);
  }

  const ok = await verifyPassword(password, (row as any).salt, (row as any).hash);
  if (!ok) {
    noteLoginFailure(bucket);
    return json({ success: false, error: "invalid_credentials" }, 401);
  }

  clearLoginFailures(bucket);

  const cookie = await createSessionCookie(
    { uid: Number((row as any).id), name: String((row as any).username), role: String((row as any).role || "user") },
    secret,
    isHttps
  );
  return json({ success: true, role: String((row as any).role || "user") }, 200, {
    "Set-Cookie": cookie,
  });
}
