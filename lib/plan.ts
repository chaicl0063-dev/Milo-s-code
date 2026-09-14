/**
 * AI 行程规划（服务端）。
 * 思路：模型只负责「从候选里挑几站并说为什么」，不许自己发明地点；
 * 排序、步行时间、时间预算、太远的站怎么办，全部由代码兜底（见 lib/planCore.ts，有测试），模型出错也总能给出一条路线。
 */
import { haversine } from "@/lib/geo";
import { completeChat, LANGUAGE_NAME } from "@/lib/guide";
import { PERSONA, type PersonaId } from "@/lib/personas";
import type { GuideLang } from "@/lib/i18n";
import type { Place } from "@/lib/places/types";
import type { Budget, Interest, RoutePlan } from "@/lib/route";
import { assemble, BUDGET_RULES, orderByNearest, routeTotalMinutes, score, type StopNotes } from "@/lib/planCore";

export { BUDGET_RULES } from "@/lib/planCore";

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
  // 候选：按分数再按距离取前 40 个，太多模型会乱。候选本身已经过 lib/places/visitable.ts 的实体过滤
  const candidates = [...input.candidates]
    .filter((p) => p.title && haversine(origin.lat, origin.lon, p.lat, p.lon) <= rule.radius + 300)
    .sort((a, b) => score(b, interests) - score(a, interests) || a.dist - b.dist)
    .slice(0, 40);
  const byIdMap = new Map(candidates.map((p) => [p.id, p] as const));

  let intro = "";
  let picked: Place[] = [];
  const notes: StopNotes = new Map();
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
      'Reply with ONLY a JSON object, no markdown: {"intro": one or two warm spoken sentences introducing the plan (max 45 words, no place names list, do not introduce yourself by name), "stops": [{"id": candidate id, "minutes": suggested stay in minutes, "why": one short sentence (max 18 words) on what to see or do there}]}',
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

  // 模型挑得太少或没挑：只用够格的候选补（有百科条目或图、或匹配兴趣），不为凑数塞进不相关的条目
  if (picked.length < rule.minStops) {
    fallback = picked.length === 0;
    for (const p of candidates) {
      if (picked.length >= rule.maxStops) break;
      if (!picked.includes(p) && score(p, interests) >= 2) picked.push(p);
    }
  }

  let stops = assemble(origin, orderByNearest(origin, picked), notes, budget);
  // 截断或丢远站之后不够站数：再从剩余合格候选里就近补一次；补不上就少几站
  if (stops.length < rule.minStops) {
    const used = new Set(stops.map((s) => s.id));
    const extra = candidates.filter((p) => !used.has(p.id) && score(p, interests) >= 2).slice(0, rule.maxStops);
    stops = assemble(origin, orderByNearest(origin, [...stops, ...extra]), notes, budget);
  }
  picked = stops;

  return { createdAt: Date.now(), origin, budget, interests, intro, stops, totalMinutes: routeTotalMinutes(stops), fallback: fallback || undefined };
}
