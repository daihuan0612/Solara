/**
 * Node 版会话票据（与 Cloudflare 版同样是「无状态签名」）
 *
 * 旧实现直接把 base64(password) 塞进 cookie：cookie 一泄露就等于口令泄露，
 * 且无法单独吊销。这里改成 `过期秒.签名`，签名 = HMAC-SHA256(密钥, 前缀+过期秒)：
 *   - 不含任何口令信息
 *   - 有明确过期时间（默认 48 小时）
 *   - 改了密钥（PASSWORD）所有旧票据立即失效
 *
 * 注意：升级后浏览器里的旧 cookie 不再被接受，用户需要重新登录一次。
 */

const crypto = require('node:crypto');

const COOKIE_NAME = 'auth';
const SESSION_TTL_SECONDS = 48 * 60 * 60;
const SIG_PREFIX = 'solara-node-session|';

function sign(exp, secret) {
  return crypto
    .createHmac('sha256', String(secret))
    .update(SIG_PREFIX + exp)
    .digest('base64url');
}

function createToken(secret, ttlSeconds = SESSION_TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return { token: `${exp}.${sign(exp, secret)}`, maxAge: ttlSeconds };
}

function verifyToken(token, secret) {
  if (typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expText = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(expText)) return false;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expected = sign(expText, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { COOKIE_NAME, SESSION_TTL_SECONDS, createToken, verifyToken };
