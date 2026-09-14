"use client";

/**
 * 核心体验指标（PRODUCT-BRIEF 1.3 / COLLABORATION C03）：
 * 从「开始讲解」到「第一段文字到达」和「第一句音频真的响起来」各花多久，分缓存命中、首次生成、被浏览器拦截三种情况。
 * 现阶段只记在浏览器里（控制台 + localStorage 最近 30 条），没有上报服务器；要看数据在控制台输入 `JSON.parse(localStorage.getItem("tourguide.metrics"))`。
 */
export interface NarrationMetric {
  at: string;
  placeId: string;
  /** hit = 服务端缓存命中；miss = 首次生成；unknown = 没拿到头 */
  cache: "hit" | "miss" | "unknown";
  /** 点开始到第一段文字（毫秒） */
  firstTextMs: number | null;
  /** 点开始到第一句音频开始播放（毫秒）；被拦截或静音时为 null */
  firstAudioMs: number | null;
  /** 浏览器拦住了自动出声 */
  blocked: boolean;
  /** 出错或被中断 */
  failed: boolean;
}

const KEY = "tourguide.metrics";
const MAX = 30;

export function recordNarrationMetric(m: NarrationMetric): void {
  try {
    console.info("[metric] narration", m);
    const raw = window.localStorage.getItem(KEY);
    const list: NarrationMetric[] = raw ? (JSON.parse(raw) as NarrationMetric[]) : [];
    list.push(m);
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    /* 隐私模式或存满 */
  }
}

/** 一次讲解的计时器：run() 开始时 new，一路 mark，结束时 flush 一次 */
export class NarrationTimer {
  private readonly start = performance.now();
  private firstText: number | null = null;
  private firstAudio: number | null = null;
  private cache: NarrationMetric["cache"] = "unknown";
  private blocked = false;
  private flushed = false;

  constructor(private readonly placeId: string) {}

  setCache(header: string | null) {
    this.cache = header === "hit" ? "hit" : header === "miss" ? "miss" : "unknown";
  }
  markText() {
    if (this.firstText === null) this.firstText = Math.round(performance.now() - this.start);
  }
  markAudio() {
    if (this.firstAudio === null) this.firstAudio = Math.round(performance.now() - this.start);
  }
  markBlocked() {
    this.blocked = true;
  }
  /** 记一次；重复调用只生效第一次 */
  flush(failed = false) {
    if (this.flushed) return;
    this.flushed = true;
    recordNarrationMetric({
      at: new Date().toISOString(),
      placeId: this.placeId,
      cache: this.cache,
      firstTextMs: this.firstText,
      firstAudioMs: this.firstAudio,
      blocked: this.blocked,
      failed,
    });
  }
}
