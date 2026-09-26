/**
 * Solara 独立 Node.js 服务器（本地/家用服务器版）
 * 替代 wrangler pages dev / Cloudflare Pages，完全不依赖 Cloudflare
 *
 * 路由结构（与 Cloudflare Pages Functions 完全一致）：
 *   GET  /              → index.html（需要认证）
 *   GET  /login         → login.html（公开）
 *   POST /api/login     → 登录
 *   GET/POST/DELETE /api/storage → 数据持久化（SQLite，可选）
 *   GET  /proxy         → 音乐 API / 音频直链 通用代理（带内存缓存）
 *   GET  /palette       → 专辑封面调色板分析（带内存缓存）
 *   *                   → 静态文件（css/, js/, favicon 等）
 */

'use strict';

// ─── 进程级安全网 ────────────────────────────────────────────────────────────
// 家用长驻服务器：切歌/断连产生的瞬时流错误（AbortError / ECONNRESET / EPIPE）
// 不应让整个进程崩溃。此处只放行这几类可预期的瞬时错误，其余仍照常抛出。
process.on('uncaughtException', (err) => {
  const name = err && err.name;
  const code = err && err.code;
  if (name === 'AbortError' || code === 'ECONNRESET' || code === 'EPIPE') {
    console.warn('[safe-net] 忽略瞬时错误:', name || code, err.message);
    return;
  }
  console.error('[uncaughtException]', err);
  process.exit(1);
});

const express      = require('express');
const cookieParser = require('cookie-parser');
const path         = require('path');

const createAuthMiddleware = require('./routes/auth');
const createLoginRouter    = require('./routes/login');
const createProxyRouter    = require('./routes/proxy');
const createPaletteRouter  = require('./routes/palette');

const PORT     = parseInt(process.env.PORT || '8787', 10);
const HOST     = process.env.HOST || '0.0.0.0';
const PASSWORD = process.env.PASSWORD || null;
const ROOT_DIR = path.join(__dirname, '..');  // 项目根目录（index.html, css/, js/ 等）

// 存储路由（SQLite）为可选：Node 无 node:sqlite 时自动降级为纯前端 localStorage
let createStorageRouter = null;
try {
  createStorageRouter = require('./routes/storage');
} catch (err) {
  console.warn('[Storage] SQLite 存储不可用，将退回浏览器 localStorage：', err.message);
}

const app = express();

// ─── 基础中间件 ────────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// ─── 公开路由（在认证中间件之前）──────────────────────────────────────────────

// POST /api/login（登录接口，不需要认证）
app.use('/api/login', createLoginRouter(PASSWORD));

// GET /login → 提供 login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'login.html'));
});

// ─── 认证中间件（公开路径会被自动跳过，见 routes/auth.js）───────────────────
app.use(createAuthMiddleware(PASSWORD));

// ─── 受保护的 API 路由 ──────────────────────────────────────────────────────────
if (createStorageRouter) {
  try {
    app.use('/api/storage', createStorageRouter());
  } catch (err) {
    console.warn('[Storage] 初始化失败，跳过 /api/storage：', err.message);
  }
}
app.use('/proxy',   createProxyRouter());
app.use('/palette', createPaletteRouter());

// ─── 静态文件服务（css/, js/, favicon.png 等）──────────────────────────────────
app.use(express.static(ROOT_DIR, {
  index: false,          // 不自动提供 index.html（由认证中间件控制）
  dotfiles: 'ignore',    // 拒绝访问 .env, .git 等隐藏文件
}));

// ─── 主页（index.html，需要已通过认证中间件）──────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// ─── 404 兜底 ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// ─── 启动 ──────────────────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log('');
  console.log('  🍎 小苹果Music Standalone Server');
  console.log('  ─────────────────────────────────────');
  console.log(`  Ready on http://${HOST}:${PORT}`);
  console.log(`  Password: ${PASSWORD ? '✓ configured' : '✗ not set (open access)'}`);
  console.log(`  Storage : ${createStorageRouter ? 'SQLite' : 'localStorage only'}`);
  console.log('  ─────────────────────────────────────');
  console.log('');
});
