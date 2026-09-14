import { test } from "node:test";
import assert from "node:assert/strict";
import { createRunGuard } from "../lib/runGuard";

/** 模拟一次会延迟返回的 TTS 请求 */
function delayed<T>(value: T, ms: number): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

test("旧 TTS 延迟返回时：中途 stop 后旧响应不播放", async () => {
  const g = createRunGuard();
  const played: string[] = [];
  const run = g.next();
  const p = delayed("old.mp3", 20).then((url) => {
    if (!g.isCurrent(run)) return "dropped";
    played.push(url);
    return "played";
  });
  g.next(); // 用户点了 stop
  assert.equal(await p, "dropped");
  assert.deepEqual(played, []);
});

test("旧请求在途时开新一轮：只播放新一轮的音频", async () => {
  const g = createRunGuard();
  const played: string[] = [];
  const start = (url: string, ms: number) => {
    const run = g.next();
    return delayed(url, ms).then(() => {
      if (g.isCurrent(run)) played.push(url);
    });
  };
  const a = start("first.mp3", 30); // 慢
  const b = start("second.mp3", 5); // 快，后发起
  await Promise.all([a, b]);
  assert.deepEqual(played, ["second.mp3"]);
});

test("没有被打断的一轮照常有效", async () => {
  const g = createRunGuard();
  const run = g.next();
  await delayed(null, 5);
  assert.equal(g.isCurrent(run), true);
  assert.equal(g.current(), run);
});
