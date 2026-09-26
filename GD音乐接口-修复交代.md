# GD Studio 音乐接口（网易云源）修复交代

> 用途：本文件可直接复制到别的项目 / 新会话使用。
> 解决的是「网易云搜索搜不到、取链/歌词/封面全是坏的」这一类问题。
> 记录时间：2026-09-13（对应 GD 官网文档更新日期 2026-06-26）
> 涉及上游：`https://music-api.gdstudio.xyz/api.php`（GD 音乐台，署名要求见文末）

---

## 一、一句话结论

**GD 接口没改参数，但它变了两个东西，导致老代码必坏：**

1. **通道**：GD 会拒绝**数据中心 IP**（Cloudflare Workers / Pages 的出口 IP），
   经服务端代理请求会拿到 **HTTP 520**（Cloudflare 报"源站返回无法解析的响应"）；
   而**浏览器直连（家庭宽带 IP）正常 200**。
2. **返回格式**：`types=url / lyric / pic` 这三个接口，新版返回 **JSON**，
   老代码按旧版**纯文本**解析 —— 于是"播放地址"拿到的是整段 JSON、封面拿到的是 JSON 而非图片 URL。

另外还有一个**老坑**（跟 GD 无关，是历史代码）：早先有人把封面写成
`/api.php?types=pic&...` 直接当 `<img src>` 用。pic 接口返回的是 `{url}` JSON，
**必须先请求拿到 url，再把 url 给 img**。

---

## 二、接口事实（实测，可直接当契约用）

| 接口 | 请求 | 返回 | 实测 |
|---|---|---|---|
| 搜索 | `?types=search&source=netease&name=月亮&count=20&pages=1` | JSON **数组**：`[{id,name,artist[],album,pic_id,lyric_id,source}]` | 200 |
| 取链 | `?types=url&source=netease&id=212412&br=320` | JSON 对象：`{url, br, size}` | 200（br=320→mp3；br=999→flac，实际 967） |
| 封面 | `?types=pic&source=netease&id=109951169338473286&size=300` | JSON 对象：`{url}`（url 指向 `p2.music.126.net`） | 200 |
| 歌词 | `?types=lyric&source=netease&id=212412` | JSON 对象：`{lyric, tlyric?}`（LRC 文本） | 200 |

- `source`：`netease`（默认）/ `joox` / `bilibili` 为文档标注的稳定源（bilibili 实测有时返回空数组属正常）。
- `br`：128 / 192 / 320 / 740（16bit 无损）/ 999（24bit 无损）。
- `size`：300 / 500（实测 200 也返回，但按文档用 300）。
- 高级用法：`source=netease_album` 可取专辑曲目。
- **CORS**：响应头带 `access-control-allow-origin: *` → **浏览器可直连**（这是修复的关键前提）。
- **限流**：官方说明「5 分钟内不超过 50 次请求」。

---

## 三、怎么修（按重要性排序）

### 修 1（最重要）：改成"浏览器直连优先 + 服务端代理兜底"

原因见"根因 1"。不要只走服务端代理，也不要只依赖直连。

```js
const GD_DIRECT = 'https://music-api.gdstudio.xyz/api.php'
const GD_PROXY = '/api/gdstudio'        // 你自己的同源代理（仅作兜底）
let gdDirectUsable = null               // null=未知；true=直连可用；false=不可用，后续直接走代理

/** 直连优先 + 代理兜底；返回 Response，由调用方解析 */
async function gdFetch(qs, { timeout = 12000 } = {}) {
  const urls = gdDirectUsable === false
    ? [`${GD_PROXY}?${qs}`]
    : [`${GD_DIRECT}?${qs}`, `${GD_PROXY}?${qs}`]
  let lastErr = null
  for (let i = 0; i < urls.length; i++) {
    try {
      const resp = await fetch(urls[i], { signal: AbortSignal.timeout(timeout) })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      if (i === 0) gdDirectUsable = true
      return resp
    } catch (e) {
      lastErr = e
      if (i === 0) gdDirectUsable = false   // 直连被拒（GD 拒数据中心 IP）→ 本次起直接走代理
    }
  }
  throw lastErr || new Error('GD 请求失败')
}
```

> 同类先例：妖狐音乐（`api.yaohud.cn`）也是"浏览器直连 + key 明文"，
> 因为它的报错就是 `Your IP is not valid`（同样拒数据中心 IP）。
> **遇到"服务端代理一律失败、本机却正常"的第三方接口，先怀疑这一条。**

### 修 2：三个接口按 JSON 解析（并兼容旧版纯文本）

```js
/** JSON 优先、旧版纯文本兜底 */
async function gdField(resp, field) {
  const text = (await resp.text()).trim()
  if (!text) return ''
  if (text.startsWith('{')) {
    try {
      const j = JSON.parse(text)
      if (j && typeof j === 'object') return String(j[field] ?? '').trim()
    } catch (_) { /* 落到纯文本兜底 */ }
  }
  return text
}

// 取播放地址
const res = await gdFetch(`types=url&source=netease&id=${song.rid}&br=320`)
const url = await gdField(res, 'url')          // ← 不是 res.text() 直接当 url！

// 取歌词
const res2 = await gdFetch(`types=lyric&source=netease&id=${rid}`)
const lrc = await gdField(res2, 'lyric')       // ← 不是 res.text() 直接当歌词！

// 取封面（必须二次请求）
export async function neteaseCover(picId) {
  if (!picId) return ''
  try {
    const resp = await gdFetch(`types=pic&source=netease&id=${encodeURIComponent(picId)}&size=300`, { timeout: 8000 })
    return await gdField(resp, 'url')          // 拿到真图 URL 才能给 <img src>
  } catch (_) { return '' }                    // 失败留空 → 界面显示占位，不要破图
}
```

### 修 3：搜索结果的封面**只补前几首**

搜索接口本身不返回图片地址（只给 `pic_id`），每张封面都要**额外一次请求**；
GD 限流是 50 次/5 分钟，所以别一次补 20 首（下面只补 8 首，可自行调）：

```js
const list = j.map(s => ({ /* ...id/name/artist/album, cover: '', picId: s.pic_id */ }))
await Promise.all(list.slice(0, 8).map(async s => { s.cover = await neteaseCover(s.picId) }))
return list
```

### 修 4（如果你也有同源代理）：代理侧两个细节

```js
// ① 不要手动指定 Accept-Encoding —— 交给平台协商，
//    否则上游返回 br 压缩时，平台可能判为"无法解析"而报 520
headers: {
  'User-Agent': 'Mozilla/5.0 ...',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  // 'Accept-Encoding': 'gzip, deflate, br',   ← 删掉这行
  'Referer': 'https://music.gdstudio.xyz/',
  'Origin': 'https://music.gdstudio.xyz',
}

// ② 上游异常包成明确的 502，而不是让平台抛 520（520 无法定位）
try {
  const resp = await fetch(target, { headers, signal: AbortSignal.timeout(30000) })
  return new Response(resp.body, { status: resp.status, headers: { 'Content-Type': resp.headers.get('content-type') || 'application/json' } })
} catch (e) {
  return new Response(JSON.stringify({ error: 'gd_upstream_error', message: String(e?.message || e) }),
    { status: 502, headers: { 'Content-Type': 'application/json' } })
}
```

---

## 四、怎么验证（照抄即可）

```bash
# ① 直连是否可用（本机 200 说明 GD 本身正常）
curl -s -m 20 "https://music-api.gdstudio.xyz/api.php?types=search&source=netease&name=%E6%9C%88%E4%BA%AE&count=2&pages=1"

# ② 你的代理这一跳是否被拒（520 / 502 就是被拒了，应用直连）
curl -s -m 20 -o /dev/null -w "HTTP %{http_code}\n" "https://你的域名/api/gdstudio?types=search&source=netease&name=love&count=2&pages=1"

# ③ 取链（把 id 换成 ① 里拿到的；注意新版 id 是字符串型）
curl -s -m 20 "https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=212412&br=320"
# 期望：{"url":"https://m801.music.126.net/....mp3","br":320,"size":...}

# ④ 歌词
curl -s -m 20 "https://music-api.gdstudio.xyz/api.php?types=lyric&source=netease&id=212412"
# 期望：{"lyric":"[00:00.000] ..."}

# ⑤ 封面
curl -s -m 20 "https://music-api.gdstudio.xyz/api.php?types=pic&source=netease&id=109951169338473286&size=300"
# 期望：{"url":"https://p2.music.126.net/.../109951169338473286.jpg?param=300y300"}
```

浏览器侧最好也做一次**端到端**（自动起本地 dev、注入登录态、切源、搜索、断言结果文本含关键词、断言无 pageerror）。
本项目的做法：临时写一个 Playwright 脚本，用 `BASE_URL` 环境变量同时跑本地和线上，跑完删除。

---

## 五、注意事项（踩过的坑）

1. **不要只走服务端代理**：GD 拒数据中心 IP，代理必失败（520）。直连优先 + 代理兜底才是稳的。
2. **不要只依赖直连**：哪天 GD 收紧 CORS，代理兜底还能救；两条腿走路。
3. **封面一定要二次请求**：`types=pic` 返回的是 JSON，不是图片。
4. **限流 5 分钟 50 次**：搜索失败重试别太猛（本项目最多重试 3 次、间隔 1.5s/3s），
   封面别一次全补（只补前 8 首）；重试时加个随机参数（如 `&_retry=2_1712345678`）可绕开上游对空结果的缓存。
5. **搜索偶发空数组是常态**：网易侧风控，多点一次即可（旧注释也是这么写的）。
6. **播放地址还要过防盗链**：`m801.music.126.net` / `music.126.net` 建议经你自己的 CDN 代理补
   `Referer: https://music.163.com/`；酷我/酷狗的直链同理（`kuwo.cn` / `kugou.com`）。
7. **署名**：GD 文档要求使用其 API 时注明出处「GD音乐台(music.gdstudio.xyz)」；
   并注意其声明：仅供学习，**禁止商用**。
8. **别把 key 当秘密**：GD 这套接口不需要 key（别去乱加）；妖狐那套的 key 本来就是前端明文，
   但**校验客户端 IP**，所以只能浏览器直连。

---

## 六、给"另一个项目 / 另一个会话"的最小落地清单

- [ ] 搜索、取链、歌词、封面**四个调用点**是否都走了同一个"直连优先 + 代理兜底"的请求函数？
- [ ] `url` / `lyric` 两个接口是否还在用"整段响应当正文"？（改成取 JSON 字段）
- [ ] 封面是否是"二次请求拿 url"？失败是否留空而不是塞 JSON 当图片地址？
- [ ] 搜索后的封面补齐是否限制条数（建议 ≤8）？
- [ ] 自建代理是否还在手动设 `Accept-Encoding`？（删掉）异常是否包成 502？
- [ ] 是否做过**线上**验证（不只是本机 curl）？线上失败/本机成功 = 数据中心 IP 被拒。
