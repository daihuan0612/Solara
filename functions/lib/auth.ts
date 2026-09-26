// 小苹果Music —— 多用户认证共享库（Cloudflare Pages Functions / D1）
//
// 设计要点：
//  - 密码用 PBKDF2-HMAC-SHA256（10 万次迭代 + 每人独立随机盐）哈希，绝不存明文。
//  - 会话用「无状态签名 Cookie」：payload.sig，sig = HMAC-SHA256(payload, AUTH_SECRET)。
//    好处：中间件校验会话不需要查 D1，热路径（/proxy、/palette）零数据库开销。
//    代价：管理员重置/删除某人后，该人已签发的旧 Cookie 要等自然过期（默认 7 天）或换设备才失效——
//         家用规模可接受；需要「立即踢下线」再加会话版本号即可。
//  - 用户数据（歌单/收藏）按 user_id 隔离，存在 *_store_v2 表；首个管理员播种时把旧的全局数据迁到管理员名下。

export type SessionUser = { uid: number; name: string; role: string };

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 天
const PBKDF2_ITERATIONS = 100000;

// ---------- 编码工具 ----------
function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 ? "0" + hex : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function b64urlEncode(input: string): string {
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return decodeURIComponent(escape(atob(b64 + pad)));
}

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// 恒定时间比较，防时序侧信道
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------- 密码哈希 ----------
async function pbkdf2(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(password, salt);
  return { salt, hash };
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  if (!salt || !hash) return false;
  const computed = await pbkdf2(password, salt);
  return timingSafeEqual(computed, hash);
}

// ---------- 会话签名 ----------
async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64urlFromBytes(new Uint8Array(sig));
}

export async function createSessionCookie(
  user: SessionUser,
  secret: string,
  isHttps: boolean
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = b64urlEncode(JSON.stringify({ uid: user.uid, name: user.name, role: user.role, exp }));
  const sig = await hmacSign(payload, secret);
  const value = `${payload}.${sig}`;
  const segments = [
    `${SESSION_COOKIE}=${value}`,
    `Max-Age=${SESSION_TTL_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
  ];
  if (isHttps) segments.push("Secure");
  return segments.join("; ");
}

export function clearSessionCookie(isHttps: boolean): string {
  const segments = [`${SESSION_COOKIE}=`, "Max-Age=0", "Path=/", "SameSite=Lax", "HttpOnly"];
  if (isHttps) segments.push("Secure");
  return segments.join("; ");
}

export function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get("Cookie") || "";
  const cookies: Record<string, string> = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) cookies[k] = v;
  });
  return cookies;
}

// 校验签名 Cookie，返回用户或 null（不查 D1）
export async function getSessionUser(request: Request, secret: string): Promise<SessionUser | null> {
  const cookies = parseCookies(request);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = await hmacSign(payload, secret);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(b64urlDecode(payload));
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof data.uid !== "number" || typeof data.name !== "string") return null;
    return { uid: data.uid, name: data.name, role: String(data.role || "user") };
  } catch {
    return null;
  }
}

// AUTH_SECRET 缺省时退回 PASSWORD；两者都无 = 关闭鉴权（开放访问）
export function getSecret(env: any): string | null {
  if (typeof env.AUTH_SECRET === "string" && env.AUTH_SECRET.length > 0) return env.AUTH_SECRET;
  if (typeof env.PASSWORD === "string" && env.PASSWORD.length > 0) return env.PASSWORD;
  return null;
}

export function hasD1(env: any): boolean {
  return Boolean(env && env.DB && typeof env.DB.prepare === "function");
}

// ---------- D1 表结构 ----------
export async function ensureAuthSchema(env: any): Promise<void> {
  if (!hasD1(env)) return;
  await env.DB.batch([
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT DEFAULT (datetime('now')))"
    ),
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS playback_store_v2 (user_id INTEGER NOT NULL, key TEXT NOT NULL, value TEXT, updated_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (user_id, key))"
    ),
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS favorites_store_v2 (user_id INTEGER NOT NULL, key TEXT NOT NULL, value TEXT, updated_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (user_id, key))"
    ),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS app_meta (k TEXT PRIMARY KEY, v TEXT)"),
  ]);
}

// 首次无用户时播种管理员，并把旧的全局数据迁到管理员名下（幂等）
export async function seedAdminIfEmpty(env: any): Promise<void> {
  if (!hasD1(env)) return;
  await ensureAuthSchema(env);
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
  const n = countRow ? Number((countRow as any).n) : 0;
  if (n > 0) return;

  const username = (typeof env.ADMIN_USERNAME === "string" && env.ADMIN_USERNAME) || "admin";
  const password =
    (typeof env.ADMIN_PASSWORD === "string" && env.ADMIN_PASSWORD) ||
    (typeof env.PASSWORD === "string" && env.PASSWORD) ||
    "admin888";
  const { salt, hash } = await hashPassword(password);
  const inserted = await env.DB.prepare(
    "INSERT INTO users (username, salt, hash, role) VALUES (?1, ?2, ?3, 'admin')"
  )
    .bind(username, salt, hash)
    .run();
  const adminId = Number((inserted as any).meta?.last_row_id || 1);

  // 迁移旧全局数据（playback_store / favorites_store）到管理员名下，只做一次
  const migratedRow = await env.DB.prepare("SELECT v FROM app_meta WHERE k = 'migrated_v2'").first();
  if (!migratedRow) {
    try {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO playback_store_v2 (user_id, key, value, updated_at) SELECT ?1, key, value, updated_at FROM playback_store"
      )
        .bind(adminId)
        .run();
    } catch {
      /* 旧表不存在则忽略 */
    }
    try {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO favorites_store_v2 (user_id, key, value, updated_at) SELECT ?1, key, value, updated_at FROM favorites_store"
      )
        .bind(adminId)
        .run();
    } catch {
      /* 旧表不存在则忽略 */
    }
    await env.DB.prepare("INSERT OR REPLACE INTO app_meta (k, v) VALUES ('migrated_v2', ?1)")
      .bind(String(adminId))
      .run();
  }
}

// 从会话解析出 user_id：开放模式（无 secret）返回 0（共享/访客数据槽）
export async function resolveUserId(request: Request, env: any): Promise<number> {
  const secret = getSecret(env);
  if (!secret) return 0;
  const user = await getSessionUser(request, secret);
  return user ? user.uid : 0;
}
