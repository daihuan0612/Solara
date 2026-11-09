import { getSecret, getSessionUser } from "./lib/auth";

const PUBLIC_PATH_PATTERNS = [
  /^\/login(?:\/|$)/,
  /^\/api\/login(?:\/|$)/,
  /^\/api\/logout(?:\/|$)/,
];

// 公开的静态资源：按**目录前缀 + 明确文件名**放行。
// 早期按扩展名放行（.js/.json/.txt…）会把 server/db.js、cookie.txt、data/*.json
// 这类不该公开的文件一起放出去，任何人未登录即可下载源码与本地凭据。
const PUBLIC_ASSET_PREFIXES = ["/css/", "/js/", "/fonts/", "/icons/", "/assets/"];
const PUBLIC_ASSET_FILES = new Set([
  "/favicon.png",
  "/favicon.svg",
  "/favicon1.png",
  "/manifest.json",
  "/service-worker.js",
  "/robots.txt",
]);

// 归一化路径：先解码（%73erver → server），再折叠 ./ 与 ../
// 不做这一步时 /%73erver/db.js、/./server/db.js 都能绕过下面的黑名单。
function normalizePath(raw: string): string {
  let p = raw;
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(p);
      if (decoded === p) break;
      p = decoded;
    } catch {
      break;
    }
  }
  p = p.replace(/\\/g, "/");
  const parts: string[] = [];
  for (const segment of p.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return "/" + parts.join("/");
}

function isPublicAsset(pathname: string): boolean {
  if (PUBLIC_ASSET_FILES.has(pathname)) return true;
  return PUBLIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(pathname)) || isPublicAsset(pathname);
}

// 源码 / 数据 / 部署配置：无论是否登录都不通过 HTTP 提供。
// Pages 会把仓库根当静态目录发，登录用户也能拿到 /server/db.js，这类文件一律 404。
const DENIED_PREFIXES = ["/server/", "/functions/", "/data/", "/scripts/", "/.git/"];
const DENIED_FILES = new Set([
  "/cookie.txt",
  "/package.json",
  "/package-lock.json",
  "/wrangler.toml",
  "/schema.sql",
  "/.env",
  "/.dev.vars",
]);

function isDeniedSourcePath(pathname: string): boolean {
  // 按小写比对：Windows 上 /Server/db.js 照样能落到 server/db.js，大小写不能当保护
  const lower = pathname.toLowerCase();
  if (DENIED_FILES.has(lower)) return true;
  return DENIED_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

// admin.html 是 .html（不在公开扩展名里），仍需登录；这里额外拦成「仅管理员」
function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin.") || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");
}

function isApiPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/proxy") ||
    pathname.startsWith("/palette")
  );
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// 开放模式只警告一次，避免每个请求刷日志
let warnedOpenMode = false;

export async function onRequest(context: any) {
  const { request } = context;
  const env = context.env;
  const secret = getSecret(env);

  const url = new URL(request.url);
  const pathname = normalizePath(url.pathname);

  // 源码/数据/配置先拦：即使是开放模式也不该把 server/*.js、cookie.txt 当静态文件发出去
  if (isDeniedSourcePath(pathname)) {
    return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }

  // 未配置 AUTH_SECRET / PASSWORD → 开放访问（保留旧行为，方便本地/无鉴权部署）
  if (!secret) {
    if (!warnedOpenMode) {
      warnedOpenMode = true;
      console.warn(
        "[auth] AUTH_SECRET 与 PASSWORD 都未配置：当前为开放模式，/api/storage、/proxy 无鉴权。生产环境请配置 AUTH_SECRET。"
      );
    }
    return context.next();
  }

  if (isPublicPath(pathname)) {
    return context.next();
  }

  const user = await getSessionUser(request, secret);

  if (!user) {
    if (isApiPath(pathname)) {
      return jsonError(401, "unauthorized");
    }
    return Response.redirect(new URL("/login", url).toString(), 302);
  }

  // 管理员专属区
  if (isAdminPath(pathname) && user.role !== "admin") {
    if (isApiPath(pathname)) {
      return jsonError(403, "forbidden");
    }
    return Response.redirect(new URL("/", url).toString(), 302);
  }

  return context.next();
}
