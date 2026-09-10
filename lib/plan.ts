/**
 * AI 行程规划（服务端）。
 * 思路：模型只负责「从候选里挑几站并说为什么」，不许自己发明地点；
 * 排序、步行时间、时间预算、太远的站怎么办，全部由代码兜底，模型出错也总能给出一条路线。
 */
import { haversine } from "@/lib/geo";
import { completeChat } from "@/lib/guide";
import { PERSONA, type PersonaId } from "@/lib/personas";
import { LANGUAGE_NAME } from "@/lib/guide";
import type { GuideLang } from "@/lib/i18n";
import type { Place } from "@/lib/places/types";
import type { Budget, Interest, RoutePlan, RouteStop } from "@/lib/route";

/** 每档预算：总分钟、候选搜索半径、站数范围 */
export const BUDGET_RULES: Record<Budget, { minutes: number; radius: number; minStops: number; maxStops: number; maxDwell: number }> = {
  "1h": { minutes: 60, radius: 1000, minStops: 2, maxStops: 3, maxDwell: 25 },
  half: { minutes: 240, radius: 3000, minStops: 3, maxStops: 5, maxDwell: 60 },
  day: { minutes: 480, radius: 5000, minStops: 5, maxStops: 7, maxDwell: 90 },
};

const WALK_M_PER_MIN = 80; // 约 4.8 km/h
const TRANSIT_THRESHOLD_M = 2000; // 一段路超过 2 公里就建议乘车
const MAX_LEG_M = 6000; // 再远就不该出现在同一条步行路线里，直接丢
const DEFAULT_DWELL: Partial<Record<NonNullable<Place["category"]>, number>> = { museum: 60, gallery: 50, zoo: 90, theme_park: 120, park: 30 };

function legFor(meters: number): Pick<RouteStop, "legMeters" | "legMinutes" | "legMode"> {
  if (meters > TRANSIT_THRESHOLD_M) {
    // 公交或打车：按 18 km/h 加 10 分钟等车
    return { legMeters: Math.round(meters), legMinutes: Math.round(meters / 300 + 10), legMode: "transit" };
  }
  return { legMeters: Math.round(meters), legMinutes: Math.max(1, Math.round(meters / WALK_M_PER_MIN)), legMode: "walk" };
}

/** 停留时间：模型建议的优先，夹在 10 分钟到该档上限之间；没建议就按类别给默认值，同样受上限约束 */
function dwellFor(p: Place, budget: Budget, suggested?: number): number {
  const cap = BUDGET_RULES[budget].maxDwell;
  if (typeof suggested === "number" && Number.isFinite(suggested)) return Math.min(cap, Math.max(10, Math.round(suggested)));
  return Math.min(cap, (p.category && DEFAULT_DWELL[p.category]) ?? 30);
}

/** 最近邻排序：从出发点开始，每次去最近的下一站，避免模型给的顺序来回折返 */
function orderByNearest(origin: { lat: number; lon: number }, picks: Place[]): Place[] {
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

/** 把挑好的站串成路线：算每段路、丢掉太远的、按时间预算从尾部截断 */
function assemble(origin: { lat: number; lon: number }, ordered: Place[], notes: Map<string, { minutes?: number; why?: string }>, budget: Budget): RouteStop[] {
  const rule = BUDGET_RULES[budget];
  const stops: RouteStop[] = [];
  let cur = origin;
  let total = 0;
  for (const p of ordered) {
    const meters = haversine(cur.lat, cur.lon, p.lat, p.lon);
    if (meters > MAX_LEG_M) continue;
    const leg = legFor(meters);
    const note = notes.get(p.id);
    const minutes = dwellFor(p, budget, note?.minutes);
    if (stops.length >= rule.minStops && total + leg.legMinutes + minutes > rule.minutes) break;
    total += leg.legMinutes + minutes;
    stops.push({ ...p, minutes, why: note?.why ?? "", ...leg });
    cur = p;
    if (stops.length >= rule.maxStops) break;
  }
  return stops;
}

/** 候选打分：有百科正文和图的更像「值得去的地方」 */
function score(p: Place, interests: Interest[]): number {
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

function interestWords(interests: Interest[]): string {
  const map: Record<Interest, string> = {
    history: "history and heritage",
    art: "art, museums and architecture",
    food: "local food (if there are cafés, markets or food streets among the candidates; otherwise suggest a break in the intro)",
    nature: "parks, gardens and viewpoints",
    kids: "family-friendly places for children",
    any: "a relaxed mix of the best-known sights",
  };
  return interests.map((i) => map[i]).join("; ");
}

export interface PlanInput {
  origin: { lat: number; lon: number };
  candidates: Place[];
  budget: Budget;
  interests: Interest[];
  lang: GuideLang;
  persona: PersonaId;
  areaName?: string | null;
}

export async function buildPlan(input: PlanInput): Promise<RoutePlan> {
  const { origin, budget, interests, lang, persona } = input;
  const rule = BUDGET_RULES[budget];
  // 候选：按分数再按距离取前 40 个，太多模型会乱
  const candidates = [...input.candidates]
    .filter((p) => p.title && haversine(origin.lat, origin.lon, p.lat, p.lon) <= rule.radius + 300)
    .sort((a, b) => score(b, interests) - score(a, interests) || a.dist - b.dist)
    .slice(0, 40);
  const byIdMap = new Map(candidates.map((p) => [p.id, p] as const));

  let intro = "";
  let picked: Place[] = [];
  const notes = new Map<string, { minutes?: number; why?: string }>();
  let fallback = false;
  let rawForLog = "";

  if (candidates.length === 0) {
    return { createdAt: Date.now(), origin, budget, interests, intro: "", stops: [], totalMinutes: 0, fallback: true };
  }

  try {
    const list = candidates
      .map((p) => `- id=${p.id} | ${p.title}${p.category ? ` | ${p.category}` : ""} | ${Math.round(p.dist)} m${p.description ? ` | ${p.description.slice(0, 80)}` : ""}${p.unesco ? " | UNESCO" : ""}`)
      .join("\n");
    const system = [
      "You are a local tour guide planning a short walking itinerary for a traveler standing at the origin.",
      PERSONA[persona].brief,
      `Write all text in ${LANGUAGE_NAME[lang]}.`,
      `Time available: about ${rule.minutes} minutes in total, including walking. Pick ${rule.minStops} to ${rule.maxStops} stops.`,
      `Traveler's interests: ${interestWords(interests)}.`,
      "Only choose from the candidate list. Prefer well-known, genuinely worth-visiting places; avoid picking several places of the same kind unless the interests call for it. Do not invent places.",
      'Reply with ONLY a JSON object, no markdown: {"intro": one or two warm spoken sentences introducing the plan (max 45 words, no place names list), "stops": [{"id": candidate id, "minutes": suggested stay in minutes, "why": one short sentence (max 18 words) on what to see or do there}]}',
      "",
      `Origin: ${origin.lat.toFixed(4)}, ${origin.lon.toFixed(4)}${input.areaName ? ` (${input.areaName})` : ""}`,
      "CANDIDATES",
      list,
    ].join("\n");
    const raw = await completeChat([{ role: "system", content: system }, { role: "user", content: "Plan my route." }], { maxTokens: 1200, temperature: 0.4 });
    rawForLog = raw;
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    const parsed = JSON.parse(json) as { intro?: string; stops?: Array<{ id?: string; minutes?: number; why?: string }> };
    intro = typeof parsed.intro === "string" ? parsed.intro.trim() : "";
    for (const s of parsed.stops ?? []) {
      if (!s || typeof s.id !== "string") continue;
      const p = byIdMap.get(s.id);
      if (!p || picked.includes(p)) continue;
      picked.push(p);
      notes.set(p.id, { minutes: s.minutes, why: typeof s.why === "string" ? s.why.trim() : undefined });
    }
  } catch (err) {
    console.warn("[plan] llm failed, using fallback:", err instanceof Error ? err.message : err, rawForLog.slice(0, 300));
  }

  // 模型挑得太少或没挑：按分数补齐
  if (picked.length < rule.minStops) {
    fallback = picked.length === 0;
    for (const p of candidates) {
      if (picked.length >= rule.maxStops) break;
      if (!picked.includes(p)) picked.push(p);
    }
  }

  let stops = assemble(origin, orderByNearest(origin, picked), notes, budget);
  // 截断或丢远站之后不够站数：再从剩余候选里就近补
  if (stops.length < rule.minStops) {
    const used = new Set(stops.map((s) => s.id));
    const extra = candidates.filter((p) => !used.has(p.id)).slice(0, rule.maxStops);
    stops = assemble(origin, orderByNearest(origin, [...stops, ...extra]), notes, budget);
  }
  picked = stops;

  const totalMinutes = stops.reduce((sum, s) => sum + s.minutes + s.legMinutes, 0);
  return { createdAt: Date.now(), origin, budget, interests, intro, stops, totalMinutes, fallback: fallback || undefined };
}
