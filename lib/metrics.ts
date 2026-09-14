"use client";

/**
 * 核心体验指标（PRODUCT-BRIEF 1.3 / COLLABORATION C03）。
 * 计的是「讲解请求启动 → 第一段文字到达 / 第一句音频真的响起来」，另记「入口点击 → 请求启动」。
 * 「响起来」以音频元素的 playing 事件或系统语音的 onstart 为准；合成、下载、被拦截都不算。
 * 一次尝试一条记录，同一条会随状态更新（先 blocked，用户点了播放后补上真实的首句时间），有明确终态。
 * 现阶段只记在浏览器里（控制台 + localStorage 最近 30 条），不上报服务器；
 * 看数据：控制台输入 JSON.parse(localStorage.getItem("tourguide.metrics"))。
 */
export type NarrationOutcome = "pending" | "playing" | "blocked" | "muted" | "failed" | "aborted";

export interface NarrationMetric {
  /** 这次尝试的编号，更新时按它覆盖 */
  id: string;
  at: string;
  placeId: string;
  /** hit = 服务端缓存命中；miss = 首次生成；unknown = 没拿到头 */
  cache: "hit" | "miss" | "unknown";
  /** 入口点击（地图卡 / 路线卡的「听导游讲讲」）到请求启动，毫秒；没有可靠的点击记录时为 null */
  entryToRequestMs: number | null;
  /** 请求启动到第一段文字（毫秒） */
  firstTextMs: number | null;
  /** 请求启动到第一句音频真的开始播放（毫秒）；从未响起来为 null */
  firstAudioMs: number | null;
  /** 中途被浏览器拦过自动出声（即使后来用户手动播放成功，这个也保留 true） */
  blocked: boolean;
  outcome: NarrationOutcome;
}

const KEY = "tourguide.metrics";
const ENTRY_KEY = "tourguide.entryClick";
const MAX = 30;
/** 入口点击超过这么久再启动的请求，不算同一次（比如用户在详情页停了很久） */
const ENTRY_WINDOW_MS = 60_000;

export interface MetricDeps {
  now: () => number;
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
  remove: (key: string) => void;
  log?: (m: NarrationMetric) => void;
}

function browserDeps(): MetricDeps {
  return {
    now: () => performance.now(),
    read: (k) => {
      try {
        return window.localStorage.getItem(k) ?? window.sessionStorage.getItem(k);
      } catch {
        return null;
      }
    },
    write: (k, v) => {
      try {
        (k === ENTRY_KEY ? window.sessionStorage : window.localStorage).setItem(k, v);
      } catch {
        /* 隐私模式 */
      }
    },
    remove: (k) => {
      try {
        window.sessionStorage.removeItem(k);
        window.localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    },
    log: (m) => console.info("[metric] narration", m),
  };
}

/** 用户在入口（地图卡、路线卡）点「听导游讲讲」时调一下，让下一次讲解能算端到端 */
export function markEntryClick(deps: Pick<MetricDeps, "write" | "now"> = browserDeps()): void {
  deps.write(ENTRY_KEY, String(Date.now()));
}

/** 一次讲解尝试的计时器：请求启动时 new，一路 mark，每次 mark 都写回同一条记录 */
export class NarrationTimer {
  private readonly id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  private readonly start: number;
  private readonly entryToRequestMs: number | null;
  private firstText: number | null = null;
  private firstAudio: number | null = null;
  private cache: NarrationMetric["cache"] = "unknown";
  private blocked = false;
  private outcome: NarrationOutcome = "pending";
  private terminal = false;

  constructor(
    private readonly placeId: string,
    private readonly deps: MetricDeps = browserDeps(),
  ) {
    this.start = deps.now();
    const raw = deps.read(ENTRY_KEY);
    const clickedAt = raw ? Number(raw) : NaN;
    const gap = Number.isFinite(clickedAt) ? Date.now() - clickedAt : NaN;
    this.entryToRequestMs = Number.isFinite(gap) && gap >= 0 && gap <= ENTRY_WINDOW_MS ? Math.round(gap) : null;
    deps.remove(ENTRY_KEY);
    this.save();
  }

  private elapsed(): number {
    return Math.round(this.deps.now() - this.start);
  }

  setCache(header: string | null) {
    this.cache = header === "hit" ? "hit" : header === "miss" ? "miss" : "unknown";
    this.save();
  }
  /** 第一段有内容的文字到了 */
  markText() {
    if (this.firstText === null) {
      this.firstText = this.elapsed();
      this.save();
    }
  }
  /** 第一句音频真的响了（playing / onstart 事件），只记第一次；即使之前被拦过也补上 */
  markAudio() {
    if (this.terminal || this.firstAudio !== null) return;
    this.firstAudio = this.elapsed();
    this.outcome = "playing";
    this.terminal = true;
    this.save();
  }
  /** 浏览器拦住了自动出声；不是终态，等用户手动播放后 markAudio 会补上 */
  markBlocked() {
    if (this.terminal) return;
    this.blocked = true;
    this.outcome = "blocked";
    this.save();
  }
  /** 用户静音，文字流已结束：这次不会有音频 */
  markMuted() {
    if (this.terminal) return;
    this.outcome = "muted";
    this.terminal = true;
    this.save();
  }
  fail() {
    if (this.terminal) return;
    this.outcome = "failed";
    this.terminal = true;
    this.save();
  }
  /** 被新的请求顶掉或用户离开 */
  abort() {
    if (this.terminal) return;
    this.outcome = "aborted";
    this.terminal = true;
    this.save();
  }

  snapshot(): NarrationMetric {
    return {
      id: this.id,
      at: new Date().toISOString(),
      placeId: this.placeId,
      cache: this.cache,
      entryToRequestMs: this.entryToRequestMs,
      firstTextMs: this.firstText,
      firstAudioMs: this.firstAudio,
      blocked: this.blocked,
      outcome: this.outcome,
    };
  }

  private save() {
    const m = this.snapshot();
    const raw = this.deps.read(KEY);
    let list: NarrationMetric[] = [];
    try {
      list = raw ? (JSON.parse(raw) as NarrationMetric[]) : [];
    } catch {
      list = [];
    }
    const i = list.findIndex((x) => x.id === m.id);
    if (i >= 0) list[i] = m;
    else list.push(m);
    this.deps.write(KEY, JSON.stringify(list.slice(-MAX)));
    if (this.terminal) this.deps.log?.(m);
  }
}

export const METRICS_KEY = KEY;
