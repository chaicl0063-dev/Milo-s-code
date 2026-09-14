/**
 * 路线核心规则的针对性测试（COLLABORATION.md R01 / C05）。
 * 运行：pnpm test   （node --test，Node 24 直接执行 TypeScript，不需要额外工具）
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { assemble, BUDGET_RULES, orderByNearest, routeTotalMinutes, totalWithBuffer } from "../lib/planCore";
import type { Place } from "../lib/places/types";

/** 以 (0,0) 为原点，向东每 0.001 度约 111 米；用经度偏移造出指定距离的地点 */
function placeAt(id: string, eastMeters: number, extra: Partial<Place> = {}): Place {
  return { id, source: "wikipedia", title: id, lat: 0, lon: eastMeters / 111_320, dist: eastMeters, ...extra };
}
const origin = { lat: 0, lon: 0 };
const noNotes = new Map();

test("展示的总时长包含一成和 5 分钟缓冲；没有站就是 0", () => {
  assert.equal(totalWithBuffer(50, 2), 60);
  assert.equal(totalWithBuffer(0, 0), 0);
});

test("一小时档：每一站都按含缓冲的总时长校验，结果不会超过 60 分钟", () => {
  // 三个博物馆（默认停留 25 分钟上限），各隔 400 米（步行 5 分钟）：
  // 第 1 站 30 → 含缓冲 38；第 2 站 60 → 71 超预算，跳过
  const stops = assemble(origin, [placeAt("a", 400, { category: "museum" }), placeAt("b", 800, { category: "museum" }), placeAt("c", 1200, { category: "museum" })], noNotes, "1h");
  assert.ok(routeTotalMinutes(stops) <= BUDGET_RULES["1h"].minutes, `total ${routeTotalMinutes(stops)}`);
  assert.equal(stops.length, 1);
});

test("首站超预算也会被拦，不会因为是第一站就放行", () => {
  // 一站就要 25 分钟停留 + 1900 米步行 24 分钟 = 49 → 含缓冲 59（放行）；换成 2000 米刚好 → 60，再远就超
  const ok = assemble(origin, [placeAt("far", 1900, { category: "museum" })], noNotes, "1h");
  assert.equal(ok.length, 1);
  const notes = new Map([["far2", { minutes: 40 }]]); // 建议 40 分钟会被夹到 25 上限
  const tooLong = assemble(origin, [placeAt("far2", 1990, { category: "museum" })], notes, "1h");
  // 1990 m → 25 分钟步行 + 25 停留 = 50 → 60，仍在预算内
  assert.equal(tooLong.length, 1);
  const over = assemble(origin, [placeAt("x", 1990, { category: "zoo" })], new Map([["x", { minutes: 30 }]]), "1h");
  // zoo 建议 30 会夹到 25，同上 60；换更远一点就超
  assert.equal(over.length, 1);
  const beyond = assemble(origin, [placeAt("y", 1999, { category: "zoo" })], new Map([["y", { minutes: 90 }]]), "1h");
  // 1999 m → 25 分钟 + 25 = 50 → 60；上限就是 60，边界放行
  assert.equal(beyond.length, 1);
});

test("一小时档不安排乘车：超过 2 公里的站直接丢，宁可少站", () => {
  const stops = assemble(origin, [placeAt("near", 300), placeAt("far", 2500)], noNotes, "1h");
  assert.deepEqual(
    stops.map((s) => s.id),
    ["near"],
  );
  assert.ok(stops.every((s) => s.legMode === "walk"));
});

test("半天档允许乘车，但超过 6 公里的站不要", () => {
  const stops = assemble(origin, [placeAt("a", 500), placeAt("b", 3500), placeAt("c", 12000)], noNotes, "half");
  assert.deepEqual(
    stops.map((s) => s.id),
    ["a", "b"],
  );
  assert.equal(stops[1].legMode, "transit");
});

test("没有合格候选就返回空路线，总时长为 0", () => {
  const stops = assemble(origin, [placeAt("far", 9000)], noNotes, "1h");
  assert.equal(stops.length, 0);
  assert.equal(routeTotalMinutes(stops), 0);
});

test("最近邻排序从出发点开始，不折返", () => {
  const ordered = orderByNearest(origin, [placeAt("c", 900), placeAt("a", 100), placeAt("b", 500)]);
  assert.deepEqual(
    ordered.map((p) => p.id),
    ["a", "b", "c"],
  );
});

test("站数是结果：超预算的站被跳过后，更近更短的后续站仍可入选", () => {
  // 先来一个太久的站（停留 25 + 步行 15 = 40 → 49），再来一个 200 米的小站（3 分钟 + 25）：
  // 第二站累计 68 → 80 超预算跳过；不会因此终止，第三站更小也不行（预算已满）。换成第一站更短则两站都能进。
  const stops = assemble(origin, [placeAt("a", 200, { category: "park" }), placeAt("b", 400, { category: "park" }), placeAt("c", 600, { category: "park" })], noNotes, "1h");
  // park 默认 25（上限）：a: 3+25=28 → 36；b: +3+25=56 → 67 超 → 跳过；c: 从 a 算 5+25 → 58 → 69 超 → 跳过
  assert.equal(stops.length, 1);
  const short = assemble(origin, [placeAt("a", 200), placeAt("b", 400)], new Map([["a", { minutes: 10 }], ["b", { minutes: 10 }]]), "1h");
  // a: 3+10=13 → 19；b: +3+10=26 → 34
  assert.equal(short.length, 2);
});
