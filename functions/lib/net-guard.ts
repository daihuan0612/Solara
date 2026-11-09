// 出网目标守卫 —— /proxy 与 /palette 共用
//
// 这两个接口都会按请求里的 URL 去 fetch，属于典型的「用户可控目标」。
// 不做限制时，任何已登录用户都能让 Worker/服务器去打内网端口、读云元数据。
//
// 这里只做**字面量**判断（不解析 DNS：Workers 里拿不到解析结果，
// 且本项目所有合法目标都是公网音乐/封面 CDN），命中下面任意一条即拒绝：
//   - 非 http/https
//   - 主机名是 localhost / *.local / *.internal / metadata 之类
//   - 主机名是 IP 字面量且落在私网、环回、链路本地、保留段

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "instance-data",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa", ".lan"];

function parseIPv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    nums.push(n);
  }
  return nums;
}

function isPrivateIPv4([a, b]: number[]): boolean {
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10/8
  if (a === 127) return true; // 环回
  if (a === 169 && b === 254) return true; // 链路本地（含 169.254.169.254 元数据）
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 192 && b === 168) return true; // 192.168/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 运营商级 NAT 100.64/10
  if (a === 192 && b === 0) return true; // 192.0.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // 基准测试段
  if (a >= 224) return true; // 组播 + 保留 + 广播
  return false;
}

function isBlockedIPv6(host: string): boolean {
  const h = host.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  if (h === "::" || h === "::1") return true;
  if (h.startsWith("fe80")) return true; // 链路本地
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // 唯一本地 fc00::/7
  if (h.startsWith("::ffff:")) {
    const tail = h.slice("::ffff:".length);
    const dotted = parseIPv4(tail);
    if (dotted) return isPrivateIPv4(dotted);
    // 十六进制写法（::ffff:7f00:1 就是 127.0.0.1）也要还原成 IPv4 再判
    const groups = tail.split(":");
    if (groups.length === 2) {
      const hi = Number.parseInt(groups[0], 16);
      const lo = Number.parseInt(groups[1], 16);
      if (Number.isFinite(hi) && Number.isFinite(lo)) {
        return isPrivateIPv4([(hi >> 8) & 0xff, hi & 0xff, (lo >> 8) & 0xff, lo & 0xff]);
      }
    }
    return true;
  }
  // 其余 IPv6 字面量一律放行（公网 IPv6 音乐 CDN 很少见但不应误伤）
  return false;
}

export function isBlockedTarget(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return true;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;

  const host = url.hostname.toLowerCase();
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;

  // IPv6 字面量在 URL 里带方括号
  if (host.includes(":")) return isBlockedIPv6(host);

  // 纯数字 / 十六进制写法（2130706433 = 127.0.0.1, 0x7f000001 同理）：
  // 解析器会当 IP 直连，绕开点分十进制判断，一律拒绝。
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return true;

  // 看起来是 IP 但不是标准的四段十进制（如 0177.0.0.1、127.1）：按可疑处理
  if (/^[\d.]+$/.test(host)) {
    const v4 = parseIPv4(host);
    if (!v4) return true;
    return isPrivateIPv4(v4);
  }

  return false;
}

export function blockedTargetResponse(): Response {
  return new Response(
    JSON.stringify({ error: "target_not_allowed", message: "该目标地址不被允许" }),
    { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}
