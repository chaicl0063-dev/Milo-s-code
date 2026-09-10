import { NextRequest, NextResponse } from "next/server";
import { isGuideLang, isLang } from "@/lib/i18n";
import { llmConfigured } from "@/lib/guide";
import { DEFAULT_PERSONA, isPersona } from "@/lib/personas";
import { searchNearby } from "@/lib/places/nearby";
import { BUDGET_RULES, buildPlan } from "@/lib/plan";
import { isBudget, isInterest, type Interest } from "@/lib/route";

/**
 * POST /api/plan
 * body: { lat, lon, budget: "1h"|"half"|"day", interests: string[], lang, dataLang?, persona?, areaName? }
 * 从周边地点里由 AI 挑几站，代码排序、算步行时间、按预算截断，返回一条路线（见 lib/plan.ts）。
 */
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!llmConfigured()) return NextResponse.json({ error: "llm_not_configured" }, { status: 503 });
  let body: { lat?: number; lon?: number; budget?: string; interests?: unknown; lang?: string; dataLang?: string; persona?: string; areaName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const lat = Number(body.lat);
  const lon = Number(body.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "invalid lat/lon" }, { status: 400 });
  }
  const budget = isBudget(body.budget) ? body.budget : "half";
  const interests = (Array.isArray(body.interests) ? body.interests : []).filter(isInterest) as Interest[];
  if (interests.length === 0) interests.push("any");
  const lang = isGuideLang(body.lang) ? body.lang : "en";
  const dataLang = isLang(body.dataLang) ? body.dataLang : "en";
  const persona = isPersona(body.persona) ? body.persona : DEFAULT_PERSONA;

  try {
    const { places } = await searchNearby(lat, lon, dataLang, BUDGET_RULES[budget].radius, { limit: 80 });
    const plan = await buildPlan({ origin: { lat, lon }, candidates: places, budget, interests, lang, persona, areaName: body.areaName });
    if (plan.stops.length === 0) return NextResponse.json({ error: "no_candidates" }, { status: 404 });
    return NextResponse.json(plan, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[plan]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "plan_failed" }, { status: 502 });
  }
}
