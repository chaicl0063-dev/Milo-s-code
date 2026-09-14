import { NextResponse } from "next/server";

/**
 * 按 IP 的简单限流（Beta 期保护免费额度：LLM、语音合成、图片识别都是有限资源）。
 * 固定时间窗：键 = rl:<桶>:<ip>:<窗口序号>，INCR 后设过期；超过上限返回 429。
 * 存储优先用 Upstash Redis（KV_REST_API_URL / KV_REST_API_TOKEN，和邮箱登记同一个库）；
 * 没配置时退回进程内存计数（单机部署仍有效；无服务器环境下只能按实例计数，聊胜于无）。
 * 限流本身出错（Redis 超时等）一律放行，不让保护措施变成故障点。
 */
export interface LimitRule {
  /** 一个窗口内允许的次数 */
  limit: number;
  /** 窗口长度（秒） */
  windowSec: number;
}

/** 各接口的默认额度；数值可用环境变量 RATE_LIMIT_<BUCKET> 覆盖，格式 "次数/秒"，如 RATE_LIMIT_TTS=600/600 */
export const LIMITS = {
  guide: { limit: 30, windowSec: 600 },
  ask: { limit: 30, windowSec: 600 },
  plan: { limit: 10, windowSec: 600 },
  identify: { limit: 10, windowSec: 600 },
  transcribe: { limit: 20, windowSec: 600 },
  tts: { limit: 400, windowSec: 600 }, // 一句一次请求，一段讲解十几句
  signup: { limit: 5, windowSec: 3600 },
} as const;

export type Bucket = keyof typeof LIMITS;

export interface LimitResult {
  ok: boolean;
  /** 本窗口还剩几次（不会小于 0） */
  remaining: number;
  /** 被拒时建议等待的秒数 */
  retryAfterSec: number;
}

export interface LimitDeps {
  /** 计数：把 key 加一并保证在 ttlSec 后过期，返回加一后的值 */
  incr: (key: string, ttlSec: number) => Promise<number>;
  now: () => number;
}

/** 解析 "次数/秒" 覆盖值；格式不对就用默认 */
export function parseRule(raw: string | undefined, fallback: LimitRule): LimitRule {
  if (!raw) return fallback;
  const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(raw);
  if (!m) return fallback;
  const limit = Number(m[1]);
  const windowSec = Number(m[2]);
  if (limit <= 0 || windowSec <= 0) return fallback;
  return { limit, windowSec };
}

/** 纯逻辑：给定计数器，判断这次请求放不放 */
export async function checkLimit(bucket: string, id: string, rule: LimitRule, deps: LimitDeps): Promise<LimitResult> {
  const nowSec = Math.floor(deps.now() / 1000);
  const slot = Math.floor(nowSec / rule.windowSec);
  const key = `rl:${bucket}:${id}:${slot}`;
  const count = await deps.incr(key, rule.windowSec);
  const remaining = Math.max(0, rule.limit - count);
  if (count > rule.limit) {
    const retryAfterSec = (slot + 1) * rule.windowSec - nowSec;
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  return { ok: true, remaining, retryAfterSec: 0 };
}

/* ---------- 存储实现 ---------- */

function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** Upstash REST pipeline：INCR + EXPIRE 一次往返 */
async function kvIncr(key: string, ttlSec: number): Promise<number> {
  const res = await fetch(`${process.env.KV_REST_API_URL!.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, ttlSec],
    ]),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`KV HTTP ${res.status}`);
  const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  const n = Number(data?.[0]?.result);
  if (!Number.isFinite(n)) throw new Error("KV bad incr result");
  return n;
}

/** 进程内存兜底：Map<key, {count, expiresAt}>，顺手清理过期项 */
const memory = new Map<string, { count: number; expiresAt: number }>();
async function memoryIncr(key: string, ttlSec: number): Promise<number> {
  const now = Date.now();
  if (memory.size > 5000) for (const [k, v] of memory) if (v.expiresAt <= now) memory.delete(k);
  const hit = memory.get(key);
  if (hit && hit.expiresAt > now) {
    hit.count++;
    return hit.count;
  }
  memory.set(key, { count: 1, expiresAt: now + ttlSec * 1000 });
  return 1;
}

const defaultDeps: LimitDeps = {
  incr: (key, ttl) => (kvConfigured() ? kvIncr(key, ttl) : memoryIncr(key, ttl)),
  now: () => Date.now(),
};

/** 取客户端 IP：反向代理 / Vercel 都写 x-forwarded-for，取第一个 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function ruleFor(bucket: Bucket): LimitRule {
  return parseRule(process.env[`RATE_LIMIT_${bucket.toUpperCase()}`], LIMITS[bucket]);
}

/**
 * 在路由开头调用：超额返回一个现成的 429 响应，否则返回 null。
 * 环境变量 RATE_LIMIT_OFF=1 可整体关闭（本地开发或内部压测）。
 */
export async function rateLimitResponse(req: Request, bucket: Bucket): Promise<NextResponse | null> {
  if (process.env.RATE_LIMIT_OFF === "1") return null;
  try {
    const r = await checkLimit(bucket, clientIp(req), ruleFor(bucket), defaultDeps);
    if (r.ok) return null;
    return NextResponse.json(
      { error: "rate_limited", retryAfter: r.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(r.retryAfterSec), "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.warn("[ratelimit] skipped:", err instanceof Error ? err.message : err);
    return null;
  }
}
