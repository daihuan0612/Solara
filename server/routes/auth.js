/**
 * 认证中间件 —— 与 functions/_middleware.ts 保持同一套判断
 *
 *   - 公开路径（/login, /api/login）与公开静态资源（css/js/图标/清单/SW）直接放行
 *   - 其余路径校验会话 cookie（过期时间 + HMAC 签名，见 server/session.js）
 *   - 验证失败：接口返回 401 JSON，页面重定向到 /login
 */

const { COOKIE_NAME, verifyToken } = require('../session');

const PUBLIC_PATH_PATTERNS = [/^\/login(?:\/|$)/, /^\/api\/login(?:\/|$)/];

// 只放行前端真正用到的资源：按目录前缀 + 明确文件名。
// 早期按扩展名放行（.js/.json/.txt…）会把 server/db.js、cookie.txt、data/*.json
// 一起公开出去——任何人不登录就能下载源码和本地凭据。
const PUBLIC_ASSET_PREFIXES = ['/css/', '/js/', '/fonts/', '/icons/', '/assets/'];
const PUBLIC_ASSET_FILES = new Set([
  '/favicon.png',
  '/favicon.svg',
  '/favicon1.png',
  '/manifest.json',
  '/service-worker.js',
  '/robots.txt',
]);

// 归一化路径：先解码（%73erver → server），再折叠 ./ 与 ../
// 不做这一步时 /%73erver/db.js、/./server/db.js、/server%2Fdb.js 都能绕过黑名单
// （express.static 自己会解码，等于黑名单白写）。
function normalizePath(raw) {
  let p = String(raw || '/');
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(p);
      if (decoded === p) break;
      p = decoded;
    } catch {
      break;
    }
  }
  p = p.replace(/\\/g, '/');
  const parts = [];
  for (const segment of p.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return '/' + parts.join('/');
}

function isPublicAsset(pathname) {
  if (PUBLIC_ASSET_FILES.has(pathname)) return true;
  return PUBLIC_ASSET_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function isPublicPath(pathname) {
  return PUBLIC_PATH_PATTERNS.some(pattern => pattern.test(pathname)) || isPublicAsset(pathname);
}

// 源码 / 数据 / 部署配置：无论是否登录都不该通过 HTTP 取到。
// 前端运行时从不请求这些路径，所以直接 404 不影响任何功能。
const DENIED_PREFIXES = ['/server/', '/functions/', '/data/', '/scripts/', '/.git/'];
const DENIED_FILES = new Set([
  '/cookie.txt',
  '/package.json',
  '/package-lock.json',
  '/wrangler.toml',
  '/schema.sql',
  '/.env',
  '/.dev.vars',
]);

function isDeniedSourcePath(pathname) {
  // 按小写比对：Windows 文件系统大小写不敏感，/Server/db.js 照样落到 server/db.js
  const lower = String(pathname || '').toLowerCase();
  if (DENIED_FILES.has(lower)) return true;
  return DENIED_PREFIXES.some(prefix => lower.startsWith(prefix));
}

module.exports = function createAuthMiddleware(password) {
  return (req, res, next) => {
    const pathname = normalizePath(req.path);

    if (isDeniedSourcePath(pathname)) {
      return res.status(404).type('text/plain').send('Not Found');
    }

    // 未配置密码时，全部放行
    if (typeof password !== 'string') return next();

    if (isPublicPath(pathname)) return next();

    const cookieAuth = req.cookies && req.cookies[COOKIE_NAME];
    if (verifyToken(cookieAuth, password)) return next();

    // 验证失败：API 请求返回 401 JSON，杜绝返回 HTML 导致前端 JSON 解析崩溃
    if (pathname.startsWith('/proxy') || pathname.startsWith('/api/') || pathname.startsWith('/palette')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Login required' });
    }

    // 页面请求重定向到登录页
    return res.redirect(302, '/login');
  };
};
