import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetail } from "@/lib/places/detail";
import { isGuideLang, isLang } from "@/lib/i18n";
import { DEFAULT_STYLE, LlmError, isGuideStyle, llmConfigured, openingUserMessage, streamChat, systemPrompt, type ChatMessage } from "@/lib/guide";

/**
 * POST /api/guide
 * body: { id, lang, dataLang?, style?, messages?: [{role:"assistant"|"user", content}] }
 *   lang     讲解语言（8 种之一）
 *   dataLang 取资料用的语言（en / zh，默认 en）；Wikipedia 的 id 是分语言的，要和 id 匹配
 * 不带 messages 表示要「首次讲解」，带 messages 表示在已有讲解基础上追问。
 * 返回 text/plain 的流式正文，前端边收边显示。
 */

/** 首次讲解按「语言+风格+地点」缓存，同一个地方不用每次都花额度（每个服务实例各自一份） */
const narrationCache = new Map<string, string>();
const MAX_CACHE = 500;

export async function POST(req: NextRequest) {
  if (!llmConfigured()) {
    return NextResponse.json({ error: "llm_not_configured" }, { status: 503 });
  }

  let body: { id?: string; lang?: string; dataLang?: string; style?: string; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { id, lang } = body;
  const dataLang = isLang(body.dataLang) ? body.dataLang : "en";
  const style = body.style ?? DEFAULT_STYLE; // 成人 → guide，儿童 → kids
  if (!id || typeof id !== "string" || id.length > 300) return NextResponse.json({ error: "missing id" }, { status: 400 });
  if (!isGuideLang(lang)) return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  if (!isGuideStyle(style)) return NextResponse.json({ error: "invalid style" }, { status: 400 });

  // 追问：只接受 assistant / user 两种角色，最多 6 条，每条 1000 字以内
  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "assistant" || m.role === "user") && typeof m.content === "string")
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  const isOpening = history.length === 0;
  // v2：提示词改过后旧缓存作废
  const cacheKey = `v4:${lang}:${dataLang}:${style}:${id}`;

  if (isOpening && narrationCache.has(cacheKey)) {
    return new Response(narrationCache.get(cacheKey)!, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Guide-Cache": "hit" },
    });
  }

  const place = await getPlaceDetail(dataLang, id).catch(() => null);
  if (!place) return NextResponse.json({ error: "place not found" }, { status: 404 });

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(place, lang, style) },
    ...(isOpening ? [{ role: "user" as const, content: openingUserMessage(lang, style) }] : history),
  ];

  try {
    const upstream = await streamChat(messages, req.signal);

    // 首次讲解一边透传一边攒起来，结束后放进缓存
    let collected = "";
    const decoder = new TextDecoder();
    const tee = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (isOpening) collected += decoder.decode(chunk, { stream: true });
        controller.enqueue(chunk);
      },
      flush() {
        if (isOpening && collected.trim()) {
          if (narrationCache.size >= MAX_CACHE) narrationCache.delete(narrationCache.keys().next().value!);
          narrationCache.set(cacheKey, collected);
        }
      },
    });

    return new Response(upstream.pipeThrough(tee), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Guide-Cache": "miss" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[guide]", message);
    // 模型服务限流（智谱返回 429 / code 1305）：让前端提示「导游忙」，而不是笼统的失败
    if (err instanceof LlmError && err.status === 429) {
      return NextResponse.json({ error: "llm_rate_limited" }, { status: 429 });
    }
    return NextResponse.json({ error: "llm_failed" }, { status: 502 });
  }
}
