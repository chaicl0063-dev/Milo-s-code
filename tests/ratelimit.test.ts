import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLimit, parseRule, type LimitDeps } from "../lib/ratelimit";

/** 内存计数器 + 可拨动的时钟，模拟 Redis 的 INCR/EXPIRE */
function fakeDeps(start = 1_000_000_000_000) {
  let now = start;
  const store = new Map<string, { count: number; expiresAt: number }>();
  const deps: LimitDeps = {
    now: () => now,
    incr: async (key, ttl) => {
      const hit = store.get(key);
      if (hit && hit.expiresAt > now) return ++hit.count;
      store.set(key, { count: 1, expiresAt: now + ttl * 1000 });
      return 1;
    },
  };
  return { deps, advance: (ms: number) => (now += ms), keys: () => [...store.keys()] };
}

test("窗口内超过上限后拒绝，并给出到窗口结束的等待秒数", async () => {
  const { deps } = fakeDeps();
  const rule = { limit: 3, windowSec: 60 };
  const results = [];
  for (let i = 0; i < 5; i++) results.push(await checkLimit("tts", "1.2.3.4", rule, deps));
  assert.deepEqual(results.map((r) => r.ok), [true, true, true, false, false]);
  assert.deepEqual(results.map((r) => r.remaining), [2, 1, 0, 0, 0]);
  assert.ok(results[3].retryAfterSec >= 1 && results[3].retryAfterSec <= 60);
});

test("不同 IP、不同桶互不影响", async () => {
  const { deps } = fakeDeps();
  const rule = { limit: 1, windowSec: 60 };
  assert.equal((await checkLimit("guide", "a", rule, deps)).ok, true);
  assert.equal((await checkLimit("guide", "a", rule, deps)).ok, false);
  assert.equal((await checkLimit("guide", "b", rule, deps)).ok, true);
  assert.equal((await checkLimit("ask", "a", rule, deps)).ok, true);
});

test("进入下一个窗口后重新计数", async () => {
  const { deps, advance } = fakeDeps();
  const rule = { limit: 1, windowSec: 60 };
  assert.equal((await checkLimit("plan", "a", rule, deps)).ok, true);
  assert.equal((await checkLimit("plan", "a", rule, deps)).ok, false);
  advance(61_000);
  assert.equal((await checkLimit("plan", "a", rule, deps)).ok, true);
});

test("环境变量覆盖格式 次数/秒；格式错就用默认", () => {
  const fallback = { limit: 30, windowSec: 600 };
  assert.deepEqual(parseRule("600/60", fallback), { limit: 600, windowSec: 60 });
  assert.deepEqual(parseRule("abc", fallback), fallback);
  assert.deepEqual(parseRule("0/60", fallback), fallback);
  assert.deepEqual(parseRule(undefined, fallback), fallback);
});
