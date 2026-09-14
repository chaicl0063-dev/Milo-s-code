/**
 * 路线规划的纯函数部分：不碰模型、不碰网络，能在 node --test 里直接跑。
 * 规则来源：docs/PRODUCT-BRIEF.md 4.4 与 docs/COLLABORATION.md C05 / R01。
 * 用相对路径 import，是为了让 Node 直接执行测试时不依赖 tsconfig 的 @ 别名。
 */
import { haversine } from "./geo";
import type { Place } from "./places/types";
import type { Budget, Interest, RouteStop } from "./route";

/** 每档预算：总分钟、候选搜索半径、站数范围、单站停留上限 */
export const BUDGET_RULES: Record<Budget, { minutes: number; radius: number; minStops: number; maxStops: number; maxDwell: number }> = {
  "1h": { minutes: 60, radius: 1000, minStops: 2, maxStops: 3, maxDwell: 25 },
  half: { minutes: 240, radius: 3000, minStops: 3, maxStops: 5, maxDwell: 60 },
  day: { minutes: 480, radius: 5000, minStops: 5, maxStops: 7, maxDwell: 90 },
};

export const WALK_M_PER_MIN = 80; // 约 4.8 km/h
export const TRANSIT_THRESHOLD_M = 2000; // 一段路超过 2 公里就建议乘车（一小时档直接不要这站）
export const MAX_LEG_M = 6000; // 再远就不该出现在同一条路线里，直接丢
const DEFAULT_DWELL: Partial<Record<NonNullable<Place["category"]>, number>> = { museum: 60, gallery: 50, zoo: 90, theme_park: 120, park: 30 };

/** 展示给用户的总时长：停留 + 路上，再加一成和 5 分钟缓冲（找路、拍照、等红灯）。没有站就是 0。 */
export function totalWithBuffer(rawMinutes: number, stops: number): number {
  if (stops === 0) return 0;
  return Math.round(rawMinutes * 1.1 + 5);
}

export function legFor(meters: number): Pick<RouteStop, "legMeters" | "legMinutes" | "legMode"> {
  if (meters > TRANSIT_THRESHOLD_M) {
    // 公交或打车：按 18 km/h 加 10 分钟等车
    return { legMeters: Math.round(meters), legMinutes: Math.round(meters / 300 + 10), legMode: "transit" };
  }
  return { legMeters: Math.round(meters), legMinutes: Math.max(1, Math.round(meters / WALK_M_PER_MIN)), legMode: "walk" };
}

/** 停留时间：模型建议的优先，夹在 10 分钟到该档上限之间；没建议就按类别给默认值，同样受上限约束 */
export function dwellFor(p: Place, budget: Budget, suggested?: number): number {
  const cap = BUDGET_RULES[budget].maxDwell;
  if (typeof suggested === "number" && Number.isFinite(suggested)) return Math.min(cap, Math.max(10, Math.round(suggested)));
  return Math.min(cap, (p.category && DEFAULT_DWELL[p.category]) ?? 30);
}

/** 最近邻排序：从出发点开始，每次去最近的下一站，避免模型给的顺序来回折返 */
export function orderByNearest(origin: { lat: number; lon: number }, picks: Place[]): Place[] {
  const rest = [...picks];
  const out: Place[] = [];
  let cur = origin;
  while (rest.length) {
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < rest.length; i++) {
      const d = haversine(cur.lat, cur.lon, rest[i].lat, rest[i].lon);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    }
    const [next] = rest.splice(bi, 1);
    out.push(next);
    cur = next;
  }
  return out;
}

export type StopNotes = Map<string, { minutes?: number; why?: string }>;

/**
 * 把挑好的站串成路线。
 * - 每一站都用「和最终展示一致」的总时长公式（含缓冲）校验，首站也校验；超预算的站跳过，继续看下一站（可能更近更短）
 * - 一小时档纯步行：远到要乘车的站直接不要
 * - 太远（> 6 公里）的站不要
 * - 站数是结果，不是配额
 */
export function assemble(origin: { lat: number; lon: number }, ordered: Place[], notes: StopNotes, budget: Budget): RouteStop[] {
  const rule = BUDGET_RULES[budget];
  const stops: RouteStop[] = [];
  let cur = origin;
  let raw = 0;
  for (const p of ordered) {
    if (stops.length >= rule.maxStops) break;
    const meters = haversine(cur.lat, cur.lon, p.lat, p.lon);
    if (meters > MAX_LEG_M) continue;
    if (budget === "1h" && meters > TRANSIT_THRESHOLD_M) continue;
    const leg = legFor(meters);
    const note = notes.get(p.id);
    const minutes = dwellFor(p, budget, note?.minutes);
    if (totalWithBuffer(raw + leg.legMinutes + minutes, stops.length + 1) > rule.minutes) continue;
    raw += leg.legMinutes + minutes;
    stops.push({ ...p, minutes, why: note?.why ?? "", ...leg });
    cur = p;
  }
  return stops;
}

/**
 * 候选打分：有百科条目、有图、世界遗产、匹配兴趣的更像「值得去的地方」。
 * 注意：这只是相对排序，不是「是实体可到访地点」的证明；实体过滤在 lib/places/visitable.ts。
 */
export function score(p: Place, interests: Interest[]): number {
  let s = 0;
  if (p.source === "wikipedia" || p.wikipedia) s += 3;
  if (p.thumbnail) s += 1;
  if (p.unesco) s += 2;
  const c = p.category;
  if (interests.includes("history") && (c === "historic" || c === "monument" || c === "memorial" || c === "religious")) s += 2;
  if (interests.includes("art") && (c === "museum" || c === "gallery" || c === "artwork" || c === "theatre")) s += 2;
  if (interests.includes("nature") && (c === "park" || c === "viewpoint" || c === "zoo")) s += 2;
  if (interests.includes("kids") && (c === "zoo" || c === "theme_park" || c === "park")) s += 2;
  return s;
}

/** 路线总分钟（含缓冲），给 plan.ts 和界面共用 */
export function routeTotalMinutes(stops: RouteStop[]): number {
  return totalWithBuffer(
    stops.reduce((sum, s) => sum + s.minutes + s.legMinutes, 0),
    stops.length,
  );
}
