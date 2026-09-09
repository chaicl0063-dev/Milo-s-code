/**
 * AI 导游讲解：把地点事实喂给 LLM，用导游口吻生成一段简短介绍，流式返回。
 * 走 OpenAI 兼容的 chat/completions 接口，换服务商只改环境变量：
 *   LLM_BASE_URL  例如 https://open.bigmodel.cn/api/paas/v4
 *   LLM_API_KEY
 *   LLM_MODEL     例如 glm-4.7-flash
 */
import type { PlaceDetail } from "@/lib/places/types";
import type { Lang } from "@/lib/i18n";

export const GUIDE_STYLES = ["history", "architecture", "stories", "kids"] as const;
export type GuideStyle = (typeof GUIDE_STYLES)[number];

export function isGuideStyle(v: unknown): v is GuideStyle {
  return typeof v === "string" && (GUIDE_STYLES as readonly string[]).includes(v);
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 上游模型服务返回的非 2xx，带上状态码方便路由区分「限流」和「其他错误」 */
export class LlmError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export function llmConfigured(): boolean {
  return Boolean(process.env.LLM_BASE_URL && process.env.LLM_API_KEY && process.env.LLM_MODEL);
}

const LANGUAGE_NAME: Record<Lang, string> = {
  en: "English",
  zh: "简体中文 (Simplified Chinese; convert any Traditional characters from the fact sheet, e.g. 艾菲爾鐵塔 → 埃菲尔铁塔)",
};

const STYLE_BRIEF: Record<GuideStyle, string> = {
  history: "Focus on the history: when and why it was built or came to be, who was involved, how it changed over time.",
  architecture: "Focus on what the visitor can see: form, materials, construction, design choices, details worth looking for.",
  stories: "Focus on anecdotes, legends, surprising facts and human stories connected to the place.",
  kids: "Explain for a curious 8-year-old: simple words, vivid comparisons, one fun fact, warm and playful tone.",
};

/** 把地点事实整理成给模型看的资料卡 */
function factSheet(place: PlaceDetail): string {
  const lines = [`Name: ${place.title}`];
  if (place.description) lines.push(`Short description: ${place.description}`);
  if (place.category) lines.push(`Category: ${place.category}`);
  if (place.address) lines.push(`Address: ${place.address}`);
  if (place.openingHours) lines.push(`Opening hours: ${place.openingHours}`);
  if (place.coordinates) lines.push(`Coordinates: ${place.coordinates.lat.toFixed(4)}, ${place.coordinates.lon.toFixed(4)}`);
  if (place.extract) lines.push(`Encyclopedia summary: ${place.extract}`);
  else lines.push("Encyclopedia summary: (none available)");
  return lines.join("\n");
}

export function systemPrompt(place: PlaceDetail, lang: Lang, style: GuideStyle): string {
  const thin = !place.extract;
  return [
    "You are a warm, knowledgeable local tour guide. The traveler is standing right in front of this place and listening to you.",
    `Speak in ${LANGUAGE_NAME[lang]} only.`,
    STYLE_BRIEF[style],
    "Rules:",
    "- Spoken style, as if talking: no headings, no bullet points, no markdown, no emoji.",
    thin
      ? "- The fact sheet has NO encyclopedia summary, so very little is verified about this exact place. Keep the introduction to 60 to 100 words. Describe what kind of place it is, what a visitor can see or do here, and what to look for. Do NOT state any dates, historical events, founders, owners or numbers unless they are famous, widely known facts about this exact place. It is fine to say that not much is recorded about it."
      : "- 150 to 250 words for the first introduction; answers to follow-up questions should be shorter.",
    "- Ground yourself in the fact sheet below plus well-established general knowledge about this place. Never invent a date, name or number; if unsure, say you are not certain.",
    "- Do not mention the fact sheet, Wikipedia, or that you are an AI. Do not repeat the place name more than twice.",
    "",
    "FACT SHEET",
    factSheet(place),
  ].join("\n");
}

/** 首次讲解的用户消息 */
export function openingUserMessage(lang: Lang): string {
  return lang === "zh" ? "请给我讲讲眼前这个地方。" : "Tell me about this place.";
}

/**
 * 主模型 + 备用模型。免费模型高峰期常被限流（智谱 glm-4.7-flash 返回 429 / code 1305），
 * 主模型限流就换备用的再试一次。备用模型可用 LLM_FALLBACK_MODEL 指定；
 * 用智谱时默认退到同样免费的 glm-4-flash-250414。
 */
function modelCandidates(baseUrl: string): string[] {
  const primary = process.env.LLM_MODEL!;
  const fallback = process.env.LLM_FALLBACK_MODEL ?? (baseUrl.includes("bigmodel.cn") ? "glm-4-flash-250414" : undefined);
  return fallback && fallback !== primary ? [primary, fallback] : [primary];
}

async function requestCompletion(baseUrl: string, model: string, messages: ChatMessage[], signal?: AbortSignal): Promise<Response> {
  const body: Record<string, unknown> = { model, messages, stream: true, temperature: 0.7, max_tokens: 700 };
  // 智谱的 Flash 模型默认开思考模式，讲解场景不需要，关掉更快也更省额度
  if (baseUrl.includes("bigmodel.cn")) body.thinking = { type: "disabled" };
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LLM_API_KEY}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    // 智谱把「模型过载」有时报成 400 但 code 仍是 1305，统一按限流处理
    const status = res.status === 429 || detail.includes('"1305"') ? 429 : res.status;
    throw new LlmError(status, `LLM ${model} HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res;
}

/**
 * 调用 LLM，返回只含正文增量的文本流（已经把 SSE 拆开、过滤掉 thinking 内容）。
 */
export async function streamChat(messages: ChatMessage[], signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = process.env.LLM_BASE_URL!.replace(/\/+$/, "");
  const candidates = modelCandidates(baseUrl);
  let upstream: Response | null = null;
  for (let i = 0; i < candidates.length; i++) {
    try {
      upstream = await requestCompletion(baseUrl, candidates[i], messages, signal);
      break;
    } catch (err) {
      const isLast = i === candidates.length - 1;
      if (err instanceof LlmError && err.status === 429 && !isLast) {
        console.warn(`[guide] ${candidates[i]} rate limited, falling back to ${candidates[i + 1]}`);
        continue;
      }
      throw err;
    }
  }
  if (!upstream?.body) throw new LlmError(502, "LLM returned no body");

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const reader = upstream.body.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta: string | undefined = json?.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          /* 半截 JSON 会留在下一轮 buffer 里，忽略 */
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}
