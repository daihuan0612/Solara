const API_BASE_URL = "https://music-api.gdstudio.xyz/api.php";
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

async function proxyAudio(targetUrl: string, request: Request): Promise<Response> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return new Response("Invalid target URL", { status: 400 });
  }

  // 只允许HTTP和HTTPS协议
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return new Response("Only HTTP and HTTPS are allowed", { status: 400 });
  }

  // 根据不同的域名设置不同的Referer
  let referer = parsedUrl.origin + "/";
  let origin = parsedUrl.origin;
  
  // 酷我音乐特殊处理
  if (parsedUrl.hostname.includes("kuwo")) {
    referer = "https://www.kuwo.cn/";
    origin = "https://www.kuwo.cn";
  }
  // 酷狗音乐特殊处理
  else if (parsedUrl.hostname.includes("kugou")) {
    referer = "https://www.kugou.com/";
    origin = "https://www.kugou.com";
  }
  // 妖狐API特殊处理
  else if (parsedUrl.hostname.includes("yaohud")) {
    referer = "https://api.yaohud.cn/";
    origin = "https://api.yaohud.cn";
  }

  const init: RequestInit = {
    method: request.method,
    headers: {
      "User-Agent": request.headers.get("User-Agent") ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": referer,
      "Origin": origin,
      "Connection": "keep-alive",
    },
  };

  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    (init.headers as Record<string, string>)["Range"] = rangeHeader;
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), init);
    const headers = createCorsHeaders(upstream.headers);
    if (!headers.has("Cache-Control")) {
      headers.set("Cache-Control", "public, max-age=3600");
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (error) {
    return new Response("Failed to fetch audio", { status: 502 });
  }
}

async function proxyApiRequest(url: URL, request: Request): Promise<Response> {
  const apiUrl = new URL(API_BASE_URL);
  url.searchParams.forEach((value, key) => {
    if (key === "target" || key === "callback" || key === "api") {
      return;
    }
    apiUrl.searchParams.set(key, value);
  });

  if (!apiUrl.searchParams.has("types")) {
    return new Response("Missing types", { status: 400 });
  }

  const upstream = await fetch(apiUrl.toString(), {
    headers: {
      "User-Agent": request.headers.get("User-Agent") ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Referer": "https://music.gdstudio.xyz/",
      "Origin": "https://music.gdstudio.xyz",
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
