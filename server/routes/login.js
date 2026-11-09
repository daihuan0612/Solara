/**
 * 登录接口 —— 移植自 functions/api/login.ts
 * POST /api/login
 */

const { Router } = require('express');
const { COOKIE_NAME, createToken } = require('../session');

module.exports = function createLoginRouter(password) {
  const router = Router();

  router.post('/', async (req, res) => {
    const body = req.body || {};
    const providedPassword = typeof body.password === 'string' ? body.password : '';

    // 未配置密码时直接成功
    if (typeof password !== 'string') {
      return res.json({ success: true });
    }

    if (providedPassword === password) {
      // 只下发「过期时间 + HMAC 签名」，不再把口令本身写进 cookie
      const { token, maxAge } = createToken(password);
      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

      const cookieParts = [
        `${COOKIE_NAME}=${token}`,
        `Max-Age=${maxAge}`,
        'Path=/',
        'SameSite=Lax',
        'HttpOnly',
      ];
      if (isHttps) cookieParts.push('Secure');

      res.setHeader('Set-Cookie', cookieParts.join('; '));
      return res.json({ success: true });
    }

    return res.status(401).json({ success: false });
  });

  return router;
};
