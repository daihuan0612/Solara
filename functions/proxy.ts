const API_CONFIGS: Record<string, { baseUrl: string }> = {
  "wy": { baseUrl: "https://api.nxvav.cn/api/music" },
  "kw": { baseUrl: "https://api.nxvav.cn/api/music" },
  "tx": { baseUrl: "https://api.nxvav.cn/api/music" },
  "mg": { baseUrl: "https://music-api.gdstudio.xyz/api.php" },
};

// 允许的主机名模式
const ALLOWED_HOST_PATTERNS = [
  /(^|\.)music\.163\.com$/i,
  /(^|\.)126\.net$/i,
  /(^|\.)kuwo\.cn$/i,
  /(^|\.)qq\.com$/i,
  /(^|\.)music\.qq\.com$/i,
  /(^|\.)y\.qq\.com$/i,
  /(^|\.)migu\.cn$/i,
  /(^|\.)music\.migu\.cn$/i
];
const SAFE_RESPONSE_HEADERS = ["content-type", "cache-control", "accept-ranges", "content-length", "content-range", "etag", "last-modified", "expires"];

function createCorsHeaders(init?: Headers): Headers {
  const headers = new Headers();
  if (init) {
    for (const [key, value] of init.entries()) {
      if (SAFE_RESPONSE_HEADERS.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
  }
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }
  headers.set("Access-Control-Allow-Origin", "*");
  return headers;
}

function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function getRefererForHost(hostname: string): string {
  if (/\.music\.163\.com$/.test(hostname)) {
    return "https://music.163.com/";
  }
  if (/\.126\.net$/.test(hostname)) {
    return "https://music.163.com/";
  }
  if (/\.kuwo\.cn$/.test(hostname)) {
    return "http://www.kuwo.cn/";
  }
  if (/\.qq\.com$/.test(hostname) || /\.y\.qq\.com$/.test(hostname) || /\.music\.qq\.com$/.test(hostname)) {
    return "https://y.qq.com/";
  }
  if (/\.migu\.cn$/.test(hostname) || /\.music\.migu\.cn$/.test(hostname)) {
    return "https://music.migu.cn/";
  }
  return "";
}

function isAllowedHost(hostname: string): boolean {
  if (!hostname) return false;
  return ALLOWED_HOST_PATTERNS.some(pattern => pattern.test(hostname));
}

function normalizeAudioUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (!isAllowedHost(parsed.hostname)) {
      return null;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    parsed.protocol = "http:";
    return parsed;
  } catch {
    return null;
  }
}

async function proxyAudio(targetUrl: string, request: Request): Promise<Response> {
  const normalized = normalizeAudioUrl(targetUrl);
  if (!normalized) {
    return new Response("Invalid target", { status: 400 });
  }

  const init: RequestInit = {
    method: request.method,
    headers: {
      "User-Agent": request.headers.get("User-Agent") ?? "Mozilla/5.0",
      "Referer": getRefererForHost(normalized.hostname),
    },
  };

  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    (init.headers as Record<string, string>)["Range"] = rangeHeader;
  }

  const upstream = await fetch(normalized.toString(), init);
  const headers = createCorsHeaders(upstream.headers);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "public, max-age=3600");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

async function proxyApiRequest(url: URL, request: Request): Promise<Response> {
  // 根据source参数选择不同的API端点
  const source = url.searchParams.get("source") || "wy";
  
  // 不同平台的API配置
  const API_CONFIGS: Record<string, { baseUrl: string }> = {
    "wy": { baseUrl: "https://api.nxvav.cn/api/music" },
    "kw": { baseUrl: "https://api.nxvav.cn/api/music" },
    "tx": { baseUrl: "https://api.nxvav.cn/api/music" },
    "mg": { baseUrl: "https://music-api.gdstudio.xyz/api.php" },
  };
  
  // 获取对应平台的API配置
  const config = API_CONFIGS[source] || API_CONFIGS["wy"];
  const apiUrl = new URL(config.baseUrl);
  
  url.searchParams.forEach((value, key) => {
    if (key === "target" || key === "callback") {
      return;
    }
    apiUrl.searchParams.set(key, value);
  });

  if (!apiUrl.searchParams.has("types")) {
    return new Response("Missing types", { status: 400 });
  }

  const upstream = await fetch(apiUrl.toString(), {
    headers: {
      "User-Agent": request.headers.get("User-Agent") ?? "Mozilla/5.0",
      "Accept": "application/json",
    },
  });

  const headers = createCorsHeaders(upstream.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export async function onRequest({ request }: { request: Request }): Promise<Response> {
  if (request.method === "OPTIONS") {
    return handleOptions();
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const target = url.searchParams.get("target");

  if (target) {
    return proxyAudio(target, request);
  }

  return proxyApiRequest(url, request);
}
