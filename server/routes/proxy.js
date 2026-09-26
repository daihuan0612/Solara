/**
 * 代理接口 —— 移植自 functions/proxy.ts，并按「小苹果Music 多音源」适配
 * GET /proxy
 *
 * 与上游 Solara 的关键差异（重要）：
 *   上游 server 版把 /proxy?target= 的音频代理**锁死只允许酷我(kuwo)域名**，
 *   但本项目用到 网易云(GD) / 酷我·酷狗·喜马拉雅(妖狐 yaohud) 多音源，
 *   所以这里改回 functions/proxy.ts 的**通用音频代理**（按域名设置 Referer/Origin，
 *   允许任意 http/https 直链），否则非酷我音源的音频会被拒 → 播放失败。
 *
 * 音乐 API 代理（?types=...）沿用上游的「智能边缘缓存」：
 *   - Cache HIT  → 直接返回缓存内容，不请求上游
 *   - Cache MISS → 请求上游，成功后写入本地内存缓存（5 分钟 TTL）
 *   - 搜索结果为空 / 包含错误 → 不缓存（防止把「API 繁忙」的空结果缓存住）
 */

const { Router } = require('express');
const { Readable } = require('node:stream');
const cache = require('../cache');

const API_BASE_URL = process.env.API_BASE_URL || 'https://music-api.gdstudio.xyz/api.php';

const SAFE_RESPONSE_HEADERS = [
  'content-type', 'cache-control', 'accept-ranges',
  'content-length', 'content-range', 'etag', 'last-modified', 'expires',
];

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function buildCacheKey(url) {
  // 过滤随机防缓存签名 s / _retry / nocache，以便重试成功后能更新同一个缓存项
  const u = new URL(url);
  u.searchParams.delete('s');
  u.searchParams.delete('nocache');
  u.searchParams.delete('_retry');
  return u.toString();
}

/**
 * 通用音频直链代理（带 Range 支持 + 按域名补 Referer/Origin）
 * 对应 functions/proxy.ts 的 proxyAudio。
 */
async function proxyAudio(targetUrl, req, res) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return res.status(400).send('Invalid target URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).send('Only HTTP and HTTPS are allowed');
  }

  // 按域名设置 Referer / Origin（与 functions/proxy.ts 一致）
  let referer = parsed.origin + '/';
  let origin = parsed.origin;
  const host = parsed.hostname;
  if (host.includes('kuwo')) {
    referer = 'https://www.kuwo.cn/';
    origin = 'https://www.kuwo.cn';
  } else if (host.includes('kugou')) {
    referer = 'https://www.kugou.com/';
    origin = 'https://www.kugou.com';
  } else if (host.includes('yaohud')) {
    referer = 'https://api.yaohud.cn/';
    origin = 'https://api.yaohud.cn';
  } else if (host.includes('126.net') || host.includes('music.163')) {
    // 网易云直链防盗链
    referer = 'https://music.163.com/';
    origin = 'https://music.163.com';
  }

  const headers = {
    'User-Agent': req.headers['user-agent'] || DEFAULT_UA,
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': referer,
    'Origin': origin,
    'Connection': 'keep-alive',
  };
  if (req.headers['range']) headers['Range'] = req.headers['range'];

  // 客户端断开（切歌）时立即中止上游连接，防止 Socket 泄漏
  const controller = new AbortController();
  let finished = false;
  const abortUpstream = () => {
    if (!finished) controller.abort();
  };
  req.on('close', abortUpstream);

  try {
    const upstream = await fetch(parsed.toString(), {
      method: req.method,
      headers,
      signal: controller.signal,
    });

    res.status(upstream.status);
    for (const h of SAFE_RESPONSE_HEADERS) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!upstream.headers.get('cache-control')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    if (!upstream.body) {
      finished = true;
      return res.end();
    }

    const nodeStream = Readable.fromWeb(upstream.body);
    // 关键：切歌/断连会让上游流 abort，必须监听 error，否则未处理的 'error'
    // 事件会让整个进程崩溃（这正是 Docker 版强调「防 Socket 泄漏」的原因）
    nodeStream.on('error', (err) => {
      if (err && err.name === 'AbortError') {
        console.log('[Proxy Audio] Upstream stream aborted (client switched/closed)');
      } else {
        console.error('[Proxy Audio stream]', err);
      }
      if (!res.writableEnded) res.destroy();
    });
    nodeStream.on('end', () => { finished = true; });
    // 响应侧关闭时也销毁上游流，双向清理
    res.on('close', () => {
      if (!nodeStream.destroyed) nodeStream.destroy();
    });
    return nodeStream.pipe(res);
  } catch (err) {
    finished = true;
    if (err && err.name === 'AbortError') {
      console.log('[Proxy Audio] Request aborted by client');
      return;
    }
    console.error('[Proxy Audio]', err);
    if (!res.headersSent) return res.status(502).send('Failed to fetch audio');
  }
}

/** 代理 music API 请求，带本地内存缓存（智能边缘缓存移植） */
async function proxyApiRequest(reqUrl, req, res) {
  const cacheKey = buildCacheKey(reqUrl);
  const parsedReq = new URL(reqUrl);
  const bypassCache = parsedReq.searchParams.get('nocache') === 'true';

  // ── Cache HIT ──────────────────────────────────────────────────────────────
  if (!bypassCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[Cache HIT] ${reqUrl}`);
      res.setHeader('Content-Type', cached.contentType || 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Cache-Status', 'HIT');
      res.setHeader('Access-Control-Expose-Headers', 'X-Cache-Status');
      return res.send(cached.body);
    }
  }

  // ── Cache MISS：请求上游 ────────────────────────────────────────────────────
  console.log(`[Cache MISS] Fetching from upstream: ${reqUrl}`);

  const apiUrl = new URL(API_BASE_URL);
  parsedReq.searchParams.forEach((value, key) => {
    if (key === 'target' || key === 'callback' || key === 's' || key === 'nocache' || key === '_retry') return;
    apiUrl.searchParams.set(key, value);
  });

  if (!apiUrl.searchParams.has('types')) {
    return res.status(400).send('Missing types');
  }

  let upstream;
  let responseText;
  let contentType;
  try {
    // 注意：不要手动指定 Accept-Encoding —— 交给平台协商，否则上游返回 br 压缩时可能判为无法解析
    upstream = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent': req.headers['user-agent'] || DEFAULT_UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Referer': 'https://music.gdstudio.xyz/',
        'Origin': 'https://music.gdstudio.xyz',
      },
      signal: AbortSignal.timeout(30000),
    });
    responseText = await upstream.text();
    contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
  } catch (err) {
    console.error('[Proxy API fetch]', err);
    return res.status(502).json({ error: 'gd_upstream_error', message: String(err && err.message || err) });
  }

  // ── 判断是否缓存（与 Cloudflare / 上游 server 版逻辑一致） ──────────────────
  const isSearch = parsedReq.searchParams.get('types') === 'search';
  const isEmptyResult = responseText.trim() === '[]';
  const isError = responseText.includes('"error"') || responseText.includes('"status":0');

  let shouldCache = upstream.status === 200 && !isError && !bypassCache;
  if (isSearch && isEmptyResult) shouldCache = false;

  if (shouldCache) {
    cache.set(cacheKey, { body: responseText, contentType }, 300); // 缓存 5 分钟
    console.log(`[Cache PUT] Saved to cache: ${reqUrl}`);
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Cache-Status', 'MISS');
  res.setHeader('Access-Control-Expose-Headers', 'X-Cache-Status');
  res.setHeader('Cache-Control', shouldCache ? 'public, max-age=300' : 'no-store');

  return res.status(upstream.status).send(responseText);
}

module.exports = function createProxyRouter() {
  const router = Router();

  router.options('/', (req, res) => {
    res.status(204)
      .set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      })
      .end();
  });

  router.get('/', async (req, res) => {
    const target = req.query.target;

    if (target) {
      return proxyAudio(target, req, res);
    }

    // 重建完整 URL（含查询参数）给缓存 key 使用
    const fullUrl = `http://localhost${req.originalUrl}`;
    return proxyApiRequest(fullUrl, req, res);
  });

  return router;
};
