import { getSecret, getSessionUser } from "./lib/auth";

const PUBLIC_PATH_PATTERNS = [
  /^\/login(?:\/|$)/,
  /^\/api\/login(?:\/|$)/,
  /^\/api\/logout(?:\/|$)/,
];
const PUBLIC_FILE_EXTENSIONS = new Set([
  ".css",
  ".js",
  ".png",
  ".svg",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".txt",
  ".map",
  ".json",
  ".woff",
  ".woff2",
]);

function hasPublicExtension(pathname: string): boolean {
  const lastDotIndex = pathname.lastIndexOf(".");
  if (lastDotIndex === -1) return false;
  const extension = pathname.slice(lastDotIndex).toLowerCase();
  return PUBLIC_FILE_EXTENSIONS.has(extension);
}

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(pathname)) || hasPublicExtension(pathname)
  );
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

export async function onRequest(context: any) {
  const { request } = context;
  const env = context.env;
  const secret = getSecret(env);

  // 未配置 AUTH_SECRET / PASSWORD → 开放访问（保留旧行为，方便本地/无鉴权部署）
  if (!secret) {
    return context.next();
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

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
