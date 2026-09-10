import { NextRequest, NextResponse } from "next/server";
import { GUIDE_LANG_LABEL, isGuideLang } from "@/lib/i18n";
import { llmConfigured } from "@/lib/guide";

/**
 * POST /api/identify
 * body: { image: "data:image/jpeg;base64,...", lang, mode?: "identify" | "translate", candidates?: [{ id, title }] }
 * identify：让多模态模型认照片里的地点；如果周边列表里有它，直接返回那条的 id。
 * translate：读出照片里的文字（路牌、菜单、展签）并翻译成讲解语言。
 * 模型：LLM_VISION_MODEL，用智谱时默认 glm-4v-flash（免费）。
 */
interface Candidate {
  id: string;
  title: string;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export async function POST(req: NextRequest) {
  if (!llmConfigured()) return NextResponse.json({ error: "llm_not_configured" }, { status: 503 });

  let body: { image?: string; lang?: string; mode?: string; candidates?: Candidate[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { image } = body;
  const lang = isGuideLang(body.lang) ? body.lang : "en";
  const mode = body.mode === "translate" ? "translate" : "identify";
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) return NextResponse.json({ error: "missing image" }, { status: 400 });
  if (image.length > 2_500_000) return NextResponse.json({ error: "image too large" }, { status: 413 });
  const candidates = (Array.isArray(body.candidates) ? body.candidates : [])
    .filter((c) => c && typeof c.id === "string" && typeof c.title === "string")
    .slice(0, 60);

  const baseUrl = process.env.LLM_BASE_URL!.replace(/\/+$/, "");
  const isZhipu = baseUrl.includes("bigmodel.cn");
  const model = process.env.LLM_VISION_MODEL ?? (isZhipu ? "glm-4v-flash" : process.env.LLM_MODEL);
  // 智谱接受纯 Base64，OpenAI 风格接受 data URL
  const imageUrl = isZhipu ? image.replace(/^data:image\/\w+;base64,/, "") : image;

  const translatePrompt = [
    "You read the text in a traveler's photo (a sign, menu, notice, museum label, ticket) for a tour-guide app.",
    `Reply with ONLY a JSON object, no markdown: {"original": all the text you can read, in its original language, line breaks preserved, "translation": a faithful translation into ${GUIDE_LANG_LABEL[lang]} (if the text is already in that language, restate it clearly), "note": at most one short sentence in ${GUIDE_LANG_LABEL[lang]} of helpful context (e.g. what the sign means for a visitor), or empty string}.`,
    "If there is no readable text, set original and translation to empty strings.",
  ].join("\n");

  const prompt = mode === "translate" ? translatePrompt : [
    "You identify the landmark, building, monument, artwork or place shown in a traveler's photo for a tour-guide app.",
    `Answer in ${GUIDE_LANG_LABEL[lang]}.`,
    candidates.length
      ? `Places near the traveler right now (exact titles): ${candidates.map((c) => JSON.stringify(c.title)).join(", ")}. If the photo shows one of them, put that exact title in "match".`
      : "",
    `Reply with ONLY a JSON object, no markdown: {"name": the place name in ${GUIDE_LANG_LABEL[lang]} or null, "kind": short category in ${GUIDE_LANG_LABEL[lang]}, "confidence": number 0-1, "brief": one or two sentences (max 40 words) in ${GUIDE_LANG_LABEL[lang]} about what is in the photo, "match": exact candidate title or null}.`,
    `If you cannot tell what place it is, set name to null and describe what you see in brief. "name", "kind" and "brief" must be written in ${GUIDE_LANG_LABEL[lang]}.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LLM_API_KEY}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: mode === "translate" ? 700 : 300,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[identify]", res.status, detail.slice(0, 200));
      return NextResponse.json({ error: res.status === 429 ? "llm_rate_limited" : "llm_failed" }, { status: res.status === 429 ? 429 : 502 });
    }
    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    if (mode === "translate") {
      let tr: { original?: string; translation?: string; note?: string } = {};
      try {
        tr = JSON.parse(jsonText);
      } catch {
        tr = { original: "", translation: raw.slice(0, 600), note: "" };
      }
      return NextResponse.json({
        original: typeof tr.original === "string" ? tr.original.trim() : "",
        translation: typeof tr.translation === "string" ? tr.translation.trim() : "",
        note: typeof tr.note === "string" ? tr.note.trim() : "",
      });
    }
    let parsed: { name?: string | null; kind?: string; confidence?: number; brief?: string; match?: string | null } = {};
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = { name: null, brief: raw.slice(0, 200) };
    }

    // 把模型给的 match 或 name 对回候选列表，拿到 id
    const wanted = [parsed.match, parsed.name].filter((x): x is string => typeof x === "string" && x.length > 0).map(normalize);
    const hit = candidates.find((c) => {
      const n = normalize(c.title);
      return wanted.some((w) => w === n || (w.length >= 4 && (n.includes(w) || w.includes(n))));
    });

    return NextResponse.json({
      name: parsed.name ?? null,
      kind: parsed.kind ?? "",
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : null,
      brief: parsed.brief ?? "",
      matchId: hit?.id ?? null,
      matchTitle: hit?.title ?? null,
    });
  } catch (err) {
    console.error("[identify]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "llm_failed" }, { status: 502 });
  }
}
