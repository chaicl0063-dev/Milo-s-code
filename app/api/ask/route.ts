import { NextRequest, NextResponse } from "next/server";
import { isGuideLang, isLang } from "@/lib/i18n";
import { LANGUAGE_NAME, LlmError, llmConfigured, streamChat, type ChatMessage } from "@/lib/guide";
import { DEFAULT_PERSONA, PERSONA, isPersona } from "@/lib/personas";
import { searchNearby } from "@/lib/places/nearby";

/**
 * POST /api/ask
 * body: { lat, lon, lang, dataLang?, persona?, areaName?, messages: [{role, content}] }
 * 「随手问」：不针对某个地点，导游知道你在哪、周边有什么，回答任何问题。流式 text/plain。
 */
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!llmConfigured()) return NextResponse.json({ error: "llm_not_configured" }, { status: 503 });
  let body: { lat?: number; lon?: number; lang?: string; dataLang?: string; persona?: string; areaName?: string; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const lang = isGuideLang(body.lang) ? body.lang : "en";
  const dataLang = isLang(body.dataLang) ? body.dataLang : "en";
  const persona = isPersona(body.persona) ? body.persona : DEFAULT_PERSONA;
  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "assistant" || m.role === "user") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  if (history.length === 0 || history[history.length - 1].role !== "user") return NextResponse.json({ error: "missing question" }, { status: 400 });

  const lat = Number(body.lat);
  const lon = Number(body.lon);
  const hasPos = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  // 周边资料：只要 Wikipedia 的快速结果，一两秒内回
  let around = "";
  if (hasPos) {
    try {
      const { places } = await searchNearby(lat, lon, dataLang, 1500, { fast: true, limit: 25 });
      around = places.map((p) => `- ${p.title} (${Math.round(p.dist)} m)${p.description ? `: ${p.description.slice(0, 80)}` : ""}`).join("\n");
    } catch {
      around = "";
    }
  }

  const system = [
    "You are a knowledgeable local tour guide walking with a traveler and chatting with them.",
    PERSONA[persona].brief,
    `Speak in ${LANGUAGE_NAME[lang]} only.`,
    "Rules:",
    "- Spoken style: no headings, no bullet points, no markdown, no emoji. Keep answers to 40 to 120 words unless asked for detail.",
    "- Use the traveler's location and the nearby places below when relevant. For practical questions (food, rest, toilets, transport) give general local advice and point to nearby places if any fit; say plainly when you do not know something specific. Never invent opening hours, prices or names.",
    "- Do not mention this list, Wikipedia, or that you are an AI.",
    "",
    hasPos ? `TRAVELER LOCATION: ${lat.toFixed(4)}, ${lon.toFixed(4)}${body.areaName ? ` (${body.areaName})` : ""}` : "TRAVELER LOCATION: unknown",
    around ? `NEARBY PLACES\n${around}` : "NEARBY PLACES: (none loaded)",
  ].join("\n");

  try {
    const upstream = await streamChat([{ role: "system", content: system }, ...history], req.signal);
    return new Response(upstream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[ask]", err instanceof Error ? err.message : err);
    if (err instanceof LlmError && err.status === 429) return NextResponse.json({ error: "llm_rate_limited" }, { status: 429 });
    return NextResponse.json({ error: "llm_failed" }, { status: 502 });
  }
}
