/**
 * 讲解指标计时器（COLLABORATION C03 / 第 14 节 Codex 要求）：
 * 首句音频只在真的播放时记；被拦截后同一条记录能补真实时间；重试不串记录；静音、失败、中止有明确终态。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { markEntryClick, METRICS_KEY, NarrationTimer, type MetricDeps, type NarrationMetric } from "../lib/metrics";

function fakeDeps(startAt = 1000) {
  let t = startAt;
  const store = new Map<string, string>();
  const deps: MetricDeps = {
    now: () => t,
    read: (k) => store.get(k) ?? null,
    write: (k, v) => void store.set(k, v),
    remove: (k) => void store.delete(k),
  };
  const advance = (ms: number) => (t += ms);
  const list = () => JSON.parse(store.get(METRICS_KEY) ?? "[]") as NarrationMetric[];
  return { deps, advance, list, store };
}

test("首句音频只在 playing 事件到来时记，准备和下载的时间都算进去", () => {
  const { deps, advance, list } = fakeDeps();
  const tm = new NarrationTimer("wp:X", deps);
  advance(800);
  tm.markText();
  advance(2400); // 合成 + 下载
  tm.markAudio();
  const m = list()[0];
  assert.equal(m.firstTextMs, 800);
  assert.equal(m.firstAudioMs, 3200);
  assert.equal(m.outcome, "playing");
  assert.equal(list().length, 1);
});

test("被拦截后记 blocked；用户手动播放后同一条记录补上真实首句时间，blocked 仍为 true", () => {
  const { deps, advance, list } = fakeDeps();
  const tm = new NarrationTimer("wp:X", deps);
  advance(500);
  tm.markText();
  advance(300);
  tm.markBlocked();
  assert.equal(list()[0].outcome, "blocked");
  assert.equal(list()[0].firstAudioMs, null);
  advance(5000); // 用户过了 5 秒才点播放
  tm.markAudio();
  const m = list()[0];
  assert.equal(list().length, 1, "同一次尝试只有一条");
  assert.equal(m.outcome, "playing");
  assert.equal(m.blocked, true);
  assert.equal(m.firstAudioMs, 5800);
});

test("快速重试：旧计时器标 aborted，新计时器独立记录，互不覆盖", () => {
  const { deps, advance, list } = fakeDeps();
  const a = new NarrationTimer("wp:X", deps);
  advance(200);
  a.abort();
  const b = new NarrationTimer("wp:X", deps);
  advance(900);
  b.markText();
  advance(100);
  b.markAudio();
  a.markAudio(); // 旧请求晚到的事件不应改动
  const l = list();
  assert.equal(l.length, 2);
  assert.equal(l[0].outcome, "aborted");
  assert.equal(l[0].firstAudioMs, null);
  assert.equal(l[1].outcome, "playing");
  assert.equal(l[1].firstAudioMs, 1000);
});

test("静音与失败是终态，不会被后来的事件改成成功", () => {
  const { deps, advance, list } = fakeDeps();
  const m1 = new NarrationTimer("wp:A", deps);
  advance(100);
  m1.markText();
  m1.markMuted();
  m1.markAudio();
  assert.equal(list()[0].outcome, "muted");
  assert.equal(list()[0].firstAudioMs, null);
  const m2 = new NarrationTimer("wp:B", deps);
  m2.fail();
  m2.markAudio();
  assert.equal(list()[1].outcome, "failed");
});

test("入口点击到请求启动：60 秒内算同一次，超过不算，用完即清", () => {
  const { deps, list, store } = fakeDeps();
  const realNow = Date.now;
  try {
    let wall = 1_700_000_000_000;
    Date.now = () => wall;
    markEntryClick(deps);
    wall += 1500;
    new NarrationTimer("wp:X", deps);
    assert.equal(list()[0].entryToRequestMs, 1500);
    assert.equal(store.has("tourguide.entryClick"), false, "用过就清掉，不会算到下一次");
    markEntryClick(deps);
    wall += 120_000;
    new NarrationTimer("wp:Y", deps);
    assert.equal(list()[1].entryToRequestMs, null);
  } finally {
    Date.now = realNow;
  }
});

test("缓存命中标记来自响应头", () => {
  const { deps, list } = fakeDeps();
  const tm = new NarrationTimer("wp:X", deps);
  tm.setCache("hit");
  assert.equal(list()[0].cache, "hit");
  tm.setCache("nonsense");
  assert.equal(list()[0].cache, "unknown");
});
