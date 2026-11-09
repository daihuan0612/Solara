import { ensureAuthSchema, resolveUserId } from "../lib/auth";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type Env = {
  DB?: D1Database;
};

type StorageData = Record<string, string | null>;

type JsonBody = {
  data?: Record<string, unknown>;
  keys?: unknown;
};

const FAVORITE_KEYS = new Set([
  "favoriteSongs",
  "currentFavoriteIndex",
  "favoritePlayMode",
  "favoritePlaybackTime",
]);

// 按用户隔离的表（复合主键 user_id+key）
const TABLES = {
  playback: "playback_store_v2",
  favorites: "favorites_store_v2",
} as const;

// D1 的硬限制：单条查询 100 个绑定参数、单次调用 50 条查询。
// 这里留出余量分片，避免一次提交几千个 key 直接整批失败。
const MAX_KEYS_PER_QUERY = 90;
const MAX_STATEMENTS_PER_BATCH = 40;

type TableName = (typeof TABLES)[keyof typeof TABLES];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function hasD1(env: Env): env is Required<Env> {
  return Boolean(env.DB && typeof env.DB.prepare === "function");
}

function getTableForKey(key: string): TableName {
  return FAVORITE_KEYS.has(key) ? TABLES.favorites : TABLES.playback;
}

// 分批执行：每批最多 40 条语句，串行等完再下一批（batch 本身只算 1 次查询配额）
async function runStatementBatches(
  env: Env,
  statements: D1PreparedStatement[]
): Promise<void> {
  for (let i = 0; i < statements.length; i += MAX_STATEMENTS_PER_BATCH) {
    await env.DB.batch(statements.slice(i, i + MAX_STATEMENTS_PER_BATCH));
  }
}

async function handleGet(request: Request, env: Env, userId: number): Promise<Response> {
  const url = new URL(request.url);
  if (!hasD1(env)) {
    return jsonResponse({ d1Available: false, data: {} });
  }

  const statusOnly = url.searchParams.get("status");
  if (statusOnly) {
    return jsonResponse({ d1Available: true });
  }

  const keysParam = url.searchParams.get("keys") || "";
  const keys = keysParam
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  await ensureAuthSchema(env);

  const data: StorageData = {};
  let rows: Array<{ key: string; value: string | null }> = [];

  if (keys.length > 0) {
    // D1 单条查询的绑定参数上限是 100（userId + keys），超过会整次报错，
    // 所以按 90 一片分块查，再把结果并起来。
    const results: Array<{ key: string; value: string | null }> = [];
    const chunks: string[][] = [];
    for (let i = 0; i < keys.length; i += MAX_KEYS_PER_QUERY) {
      chunks.push(keys.slice(i, i + MAX_KEYS_PER_QUERY));
    }
    for (const chunk of chunks) {
      const groupedKeys = chunk.reduce(
        (acc, key) => {
          acc[getTableForKey(key)].push(key);
          return acc;
        },
        { [TABLES.playback]: [] as string[], [TABLES.favorites]: [] as string[] }
      );
      for (const [table, tableKeys] of Object.entries(groupedKeys)) {
        if (tableKeys.length === 0) continue;
        const placeholders = tableKeys.map(() => "?").join(",");
        const statement = env.DB.prepare(
          `SELECT key, value FROM ${table} WHERE user_id = ? AND key IN (${placeholders})`
        ).bind(userId, ...tableKeys);
        const result = await statement.all();
        results.push(...(((result as any).results || []) as any[]));
      }
    }
    rows = results;
    keys.forEach((key) => {
      data[key] = null;
    });
  } else {
    const playbackResult = await env.DB.prepare(
      `SELECT key, value FROM ${TABLES.playback} WHERE user_id = ?1`
    )
      .bind(userId)
      .all();
    const favoriteResult = await env.DB.prepare(
      `SELECT key, value FROM ${TABLES.favorites} WHERE user_id = ?1`
    )
      .bind(userId)
      .all();
    rows = [
      ...(((playbackResult as any).results || []) as any[]),
      ...(((favoriteResult as any).results || []) as any[]),
    ];
  }

  rows.forEach((row) => {
    if (!row || typeof row.key !== "string") return;
    data[row.key] = row.value;
  });

  return jsonResponse({ d1Available: true, data });
}

async function handlePost(request: Request, env: Env, userId: number): Promise<Response> {
  if (!hasD1(env)) {
    return jsonResponse({ d1Available: false, data: {} });
  }

  const body = (await request.json().catch(() => ({}))) as JsonBody;
  const payload = body.data && typeof body.data === "object" ? body.data : null;

  if (!payload || Array.isArray(payload)) {
    return jsonResponse({ error: "Invalid payload" }, 400);
  }

  const entries = Object.entries(payload).filter(([key]) => Boolean(key));
  if (entries.length === 0) {
    return jsonResponse({ d1Available: true, updated: 0 });
  }

  await ensureAuthSchema(env);

  const groupedStatements: Record<string, D1PreparedStatement[]> = {
    [TABLES.playback]: [],
    [TABLES.favorites]: [],
  };

  entries.forEach(([key, value]) => {
    const storedValue = value == null ? "" : String(value);
    const table = getTableForKey(key);
    groupedStatements[table].push(
      env.DB.prepare(
        `INSERT INTO ${table} (user_id, key, value, updated_at) VALUES (?1, ?2, ?3, datetime('now')) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).bind(userId, key, storedValue)
    );
  });

  await runStatementBatches(env, [
    ...groupedStatements[TABLES.playback],
    ...groupedStatements[TABLES.favorites],
  ]);
  return jsonResponse({ d1Available: true, updated: entries.length });
}

async function handleDelete(request: Request, env: Env, userId: number): Promise<Response> {
  if (!hasD1(env)) {
    return jsonResponse({ d1Available: false });
  }

  const body = (await request.json().catch(() => ({}))) as JsonBody;
  const keys = Array.isArray(body.keys)
    ? body.keys.filter((key): key is string => typeof key === "string" && Boolean(key))
    : [];

  if (keys.length === 0) {
    return jsonResponse({ d1Available: true, deleted: 0 });
  }

  await ensureAuthSchema(env);

  const groupedStatements: Record<string, D1PreparedStatement[]> = {
    [TABLES.playback]: [],
    [TABLES.favorites]: [],
  };

  keys.forEach((key) => {
    const table = getTableForKey(key);
    groupedStatements[table].push(
      env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ?1 AND key = ?2`).bind(userId, key)
    );
  });

  await runStatementBatches(env, [
    ...groupedStatements[TABLES.playback],
    ...groupedStatements[TABLES.favorites],
  ]);
  return jsonResponse({ d1Available: true, deleted: keys.length });
}

export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  const method = (request.method || "GET").toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  // 按登录用户隔离数据；开放模式下 userId=0（共享数据槽）
  const userId = await resolveUserId(request, env);

  if (method === "GET") return handleGet(request, env, userId);
  if (method === "POST") return handlePost(request, env, userId);
  if (method === "DELETE") return handleDelete(request, env, userId);

  return jsonResponse({ error: "Method not allowed" }, 405);
}
