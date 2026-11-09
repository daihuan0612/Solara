/**
 * 简单的内存缓存模块，带 TTL（过期时间）
 * 替代 Cloudflare 的 caches.default API
 */

class SimpleCache {
  constructor() {
    /** @type {Map<string, { body: Buffer|string, contentType: string, expires: number }>} */
    this._map = new Map();
    // 条目上限：长驻服务 + 无上限 = 内存只涨不落。超了就淘汰最早写入的（Map 保持插入顺序）
    this._maxEntries = 500;

    // 每 5 分钟清理一次过期条目，防止内存泄漏
    setInterval(() => this._cleanup(), 5 * 60 * 1000).unref();
  }

  set(key, value, ttlSeconds = 300) {
    if (this._map.has(key)) this._map.delete(key);
    this._map.set(key, {
      ...value,
      expires: Date.now() + ttlSeconds * 1000,
    });
    while (this._map.size > this._maxEntries) {
      const oldest = this._map.keys().next();
      if (oldest.done) break;
      this._map.delete(oldest.value);
    }
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this._map.delete(key);
      return null;
    }
    const { expires, ...value } = entry;
    return value;
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this._map) {
      if (now > entry.expires) this._map.delete(key);
    }
  }
}

module.exports = new SimpleCache();
