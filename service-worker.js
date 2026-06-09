// 小苹果Music - Service Worker
// 缓存策略：
//   - 静态资源 (CSS/JS) → 缓存优先
//   - 音频文件 (cached-audio) → 缓存优先
//   - API 请求 → 仅网络
//   - 其他 → 网络优先

const CACHE_NAMES = {
    shell: 'solara-shell-v1',     // 应用壳（CSS, JS）
    audio: 'solara-audio-v1',     // 缓存的音频
};

const PRECACHE_URLS = [
    '/',
    '/favicon.png',
    '/favicon.svg',
    '/manifest.json',
    '/css/style.css',
    '/js/index.js',
];

// 限制缓存大小（音频缓存最多 500MB 左右，此处限制条目数）
const MAX_AUDIO_CACHE_ITEMS = 100;

// =============================================
// INSTALL：预缓存应用壳
// =============================================
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAMES.shell);
            // 逐个添加，跳过失败的（外部资源可能不可用）
            for (const url of PRECACHE_URLS) {
                try {
                    await cache.add(url);
                } catch (e) {
                    console.warn(`[SW] 预缓存失败: ${url}`, e);
                }
            }
            // 尝试缓存 FontAwesome（外部 CDN）
            try {
                await cache.add('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
            } catch (e) {
                // FontAwesome 不可用时降级
            }
        })()
    );
    self.skipWaiting();
});

// =============================================
// ACTIVATE：清理旧缓存
// =============================================
self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            const validNames = Object.values(CACHE_NAMES);
            await Promise.all(
                keys.filter(k => !validNames.includes(k)).map(k => caches.delete(k))
            );
        })()
    );
    self.clients.claim();
});

// =============================================
// FETCH：请求拦截
// =============================================
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. 音频缓存请求（由主线程写入 Cache API）
    if (url.pathname.startsWith('/cached-audio/')) {
        event.respondWith(cacheAudioFetch(event));
        return;
    }

    // 2. 静态资源（CSS/JS/字体/图标）→ 缓存优先
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(event));
        return;
    }

    // 3. API 请求 → 仅网络，不缓存
    if (url.href.includes('music-api.gdstudio.xyz') || url.href.includes('music-dl.sayqz.com')) {
        event.respondWith(networkOnly(event));
        return;
    }

    // 4. 搜索引擎/CDN 等外部资源 → 网络优先
    event.respondWith(networkFirst(event));
});

// =============================================
// 判断是否为静态资源
// =============================================
function isStaticAsset(url) {
    const path = url.pathname;
    const origin = url.origin;
    const selfOrigin = self.location.origin;

    // 同源静态资源
    if (origin === selfOrigin) {
        if (path.endsWith('.css') || path.endsWith('.js') ||
            path.endsWith('.json') || path.endsWith('.svg') ||
            path.endsWith('.png') || path.endsWith('.ico') ||
            path.endsWith('.woff2') || path.endsWith('.woff') ||
            path.endsWith('.ttf')) {
            return true;
        }
    }

    // 外部 CDN（FontAwesome 等）
    if (url.href.includes('cdnjs.cloudflare.com') ||
        url.href.includes('fonts.googleapis.com') ||
        url.href.includes('fonts.gstatic.com')) {
        return true;
    }

    return false;
}

// =============================================
// 策略：缓存优先（静态资源）
// =============================================
async function cacheFirst(event) {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
        const response = await fetch(event.request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAMES.shell);
            cache.put(event.request, response.clone());
        }
        return response;
    } catch (e) {
        return new Response('', { status: 408, statusText: 'Offline' });
    }
}

// =============================================
// 策略：网络优先（外部资源）
// =============================================
async function networkFirst(event) {
    try {
        const response = await fetch(event.request);
        if (response.ok && isStaticAsset(new URL(event.request.url))) {
            const cache = await caches.open(CACHE_NAMES.shell);
            cache.put(event.request, response.clone());
        }
        return response;
    } catch (e) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response('', { status: 408, statusText: 'Offline' });
    }
}

// =============================================
// 策略：仅网络（API 请求）
// =============================================
async function networkOnly(event) {
    try {
        return await fetch(event.request);
    } catch (e) {
        return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// =============================================
// 音频缓存：从 Cache API 读取
// =============================================
async function cacheAudioFetch(event) {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    // 如果缓存没有，尝试从原始URL回退
    try {
        return await fetch(event.request);
    } catch (e) {
        return new Response('', { status: 404, statusText: 'Audio not cached' });
    }
}

// =============================================
// 接收主线程消息：缓存音频
// =============================================
self.addEventListener('message', async event => {
    if (event.data && event.data.type === 'CACHE_AUDIO') {
        const { songId, audioUrl } = event.data;
        try {
            const response = await fetch(audioUrl);
            if (response.ok) {
                const cache = await caches.open(CACHE_NAMES.audio);
                const cacheKey = `/cached-audio/${songId}`;
                await cache.put(cacheKey, response);

                // 限制缓存大小：超出则删除最旧的
                const keys = await cache.keys();
                if (keys.length > MAX_AUDIO_CACHE_ITEMS) {
                    const toDelete = keys.slice(0, keys.length - MAX_AUDIO_CACHE_ITEMS);
                    await Promise.all(toDelete.map(k => cache.delete(k)));
                }

                event.source.postMessage({ type: 'AUDIO_CACHED', songId, success: true });
            } else {
                event.source.postMessage({ type: 'AUDIO_CACHED', songId, success: false, reason: 'fetch_failed' });
            }
        } catch (e) {
            event.source.postMessage({ type: 'AUDIO_CACHED', songId, success: false, reason: e.message });
        }
    }

    // 检查音频是否已缓存
    if (event.data && event.data.type === 'CHECK_AUDIO_CACHE') {
        const { songId } = event.data;
        const cache = await caches.open(CACHE_NAMES.audio);
        const cached = await cache.match(`/cached-audio/${songId}`);
        event.source.postMessage({
            type: 'AUDIO_CACHE_STATUS',
            songId,
            cached: !!cached
        });
    }

    // 删除缓存的音频
    if (event.data && event.data.type === 'DELETE_AUDIO_CACHE') {
        const { songId } = event.data;
        const cache = await caches.open(CACHE_NAMES.audio);
        await cache.delete(`/cached-audio/${songId}`);
        event.source.postMessage({ type: 'AUDIO_CACHE_DELETED', songId });
    }
});
