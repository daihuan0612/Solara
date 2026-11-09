/**
 * 出网目标守卫（Node 版，与 functions/lib/net-guard.ts 保持同一套规则）
 *
 * /proxy 与 /palette 都会按请求里的 URL 去 fetch。不设限时，任何已登录用户
 * 都能让本机去打内网端口、读云元数据。这里只做字面量判断（不解析 DNS），
 * 命中即拒绝：非 http/https、localhost/.local/.internal 之类、私网与保留 IP。
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
  'instance-data',
]);

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa', '.lan'];

function parseIPv4(host) {
  const parts = host.split('.');
  if (parts.length !== 4) return null;
  const nums = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    nums.push(n);
  }
  return nums;
}

function isPrivateIPv4(nums) {
  const [a, b] = nums;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isBlockedIPv6(host) {
  const h = host.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();
  if (h === '::' || h === '::1') return true;
  if (h.startsWith('fe80')) return true;
  if (h.startsWith('fc') || h.startsWith('fd')) return true;
  if (h.startsWith('::ffff:')) {
    const tail = h.slice('::ffff:'.length);
    const dotted = parseIPv4(tail);
    if (dotted) return isPrivateIPv4(dotted);
    // 十六进制写法（::ffff:7f00:1 就是 127.0.0.1）也要还原成 IPv4 再判
    const groups = tail.split(':');
    if (groups.length === 2) {
      const hi = Number.parseInt(groups[0], 16);
      const lo = Number.parseInt(groups[1], 16);
      if (Number.isFinite(hi) && Number.isFinite(lo)) {
        return isPrivateIPv4([(hi >> 8) & 0xff, hi & 0xff, (lo >> 8) & 0xff, lo & 0xff]);
      }
    }
    return true;
  }
  return false;
}

function isBlockedTarget(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return true;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;

  const host = url.hostname.toLowerCase();
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_SUFFIXES.some(suffix => host.endsWith(suffix))) return true;

  if (host.includes(':')) return isBlockedIPv6(host);

  // 纯数字 / 十六进制写法（2130706433、0x7f000001 都等于 127.0.0.1）：一律拒绝
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return true;

  // 看着像 IP 但不是标准四段十进制（0177.0.0.1、127.1）：按可疑处理
  if (/^[\d.]+$/.test(host)) {
    const v4 = parseIPv4(host);
    if (!v4) return true;
    return isPrivateIPv4(v4);
  }

  return false;
}

module.exports = { isBlockedTarget };
