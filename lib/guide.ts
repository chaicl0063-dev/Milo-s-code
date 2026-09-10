/**
 * AI 导游讲解：把地点事实喂给 LLM，用导游口吻生成一段简短介绍，流式返回。
 * 走 OpenAI 兼容的 chat/completions 接口，换服务商只改环境变量：
 *   LLM_BASE_URL  例如 https://open.bigmodel.cn/api/paas/v4
 *   LLM_API_KEY
 *   LLM_MODEL     例如 glm-4.7-flash
 */
import type { PlaceDetail } from "@/lib/places/types";
import { DEFAULT_PERSONA, PERSONA, type PersonaId } from "@/lib/personas";
import type { GuideLang } from "@/lib/i18n";

export const GUIDE_STYLES = ["guide", "history", "architecture", "stories", "kids"] as const;
export type GuideStyle = (typeof GUIDE_STYLES)[number];
export const DEFAULT_STYLE: GuideStyle = "guide";

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

const LANGUAGE_NAME: Record<GuideLang, string> = {
  en: "English",
  zh: "简体中文 (Simplified Chinese; convert any Traditional characters from the fact sheet, e.g. 艾菲爾鐵塔 → 埃菲尔铁塔)",
  es: "Spanish (español)",
  fr: "French (français)",
  de: "German (Deutsch)",
  ja: "Japanese (日本語, natural spoken register)",
  ko: "Korean (한국어, polite spoken register)",
  pt: "Portuguese (português)",
};

/**
 * 每种风格既说「讲什么」也说「用什么语气」，并明确排除其他风格的腔调，
 * 否则小模型容易把所有风格都讲成一个味。
 */
const STYLE_BRIEF: Record<GuideStyle, string> = {
  guide:
    "STYLE = GUIDE. Audience: an adult traveler standing here. Tone: warm, clear, unhurried, like a good local guide. Content, in this order: one sentence on what this is; the most important piece of its history or origin; what to look at right now (one or two concrete details); one memorable anecdote or fact if you are confident it is true. Forbidden: childlike language, lists, exclamations.",
  history:
    "STYLE = HISTORY. Audience: an educated adult. Tone: calm, measured, like a documentary narrator. Content: when and why it came to be, who built or shaped it, what happened here, how it changed over time; mention concrete years where they are certain. Forbidden: childlike comparisons, exclamations, playful asides, second-person quizzes.",
  architecture:
    "STYLE = ARCHITECTURE. Audience: an adult with an eye for design. Tone: precise, observant, unhurried. Content: what the visitor can see right now: overall form, materials, structure and construction method, proportions, notable details and where to look for them; explain design choices. Forbidden: long historical narrative, anecdotes, childlike language.",
  stories:
    "STYLE = STORIES. Audience: a curious adult. Tone: conversational, lively, a little witty, like a well-read friend. Content: anecdotes, legends, controversies, surprising facts and the people connected to the place; each story must be one you are confident is real, not invented. Forbidden: dry chronology, technical description, talking down to the listener.",
  kids:
    "STYLE = KIDS. Audience: a curious 8-year-old. Tone: warm, playful, simple words, short sentences, vivid comparisons to everyday things, one fun fact, may ask the child a question. Forbidden: exact dates lists, technical jargon, long sentences.",
};

const STYLE_ASK: Record<GuideStyle, Partial<Record<GuideLang, string>> & { en: string }> = {
  guide: { en: "Tell me about this place.", zh: "请给我讲讲眼前这个地方。" },
  history: { en: "Tell me the history of this place.", zh: "请讲讲这个地方的历史。" },
  architecture: { en: "Tell me what I am looking at, as architecture.", zh: "请从建筑的角度讲讲我眼前看到的东西。" },
  stories: { en: "Tell me the stories and anecdotes about this place.", zh: "请讲讲这个地方的趣闻和故事。" },
  kids: { en: "Explain this place to me like I am eight years old.", zh: "请把这个地方讲给一个八岁的孩子听。" },
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
  if (place.unesco) lines.push(`UNESCO World Heritage: yes (${place.unesco.name})`);
  if (place.travelGuide) lines.push(`Travel guide for the surrounding area (Wikivoyage, "${place.travelGuide.title}"): ${place.travelGuide.extract.slice(0, 600)}`);
  return lines.join("\n");
}

export function systemPrompt(place: PlaceDetail, lang: GuideLang, style: GuideStyle, persona: PersonaId = DEFAULT_PERSONA): string {
  const thin = !place.extract;
  return [
    "You are a knowledgeable local tour guide. The traveler is standing right in front of this place and listening to you.",
    PERSONA[persona].brief + " Do not introduce yourself by name unless the traveler asks who you are.",
    `Speak in ${LANGUAGE_NAME[lang]} only.`,
    STYLE_BRIEF[style],
    "Rules:",
    "- Spoken style, as if talking: no headings, no bullet points, no markdown, no emoji.",
    thin
      ? "- The fact sheet has NO encyclopedia summary, so very little is verified about this exact place. Keep the introduction to 60 to 100 words. Describe what kind of place it is, what a visitor can see or do here, and what to look for. Do NOT state any dates, historical events, founders, owners or numbers unless they are famous, widely known facts about this exact place. It is fine to say that not much is recorded about it."
      : "- 150 to 250 words for the first introduction; answers to follow-up questions should be shorter.",
    "- Ground yourself in the fact sheet below plus well-established general knowledge about this place. Never invent a date, name or number; if unsure, say you are not certain.",
    "- Do not mention the fact sheet, Wikipedia, or that you are an AI. Do not repeat the place name more than twice.",
    "- Start with the content itself. No openers like 'Sure', 'Of course', '当然可以', '好的'.",
    "",
    "FACT SHEET",
    factSheet(place),
  ].join("\n");
}

/** 首次讲解的用户消息，把风格再说一遍，小模型对用户消息里的要求更敏感 */
export function openingUserMessage(lang: GuideLang, style: GuideStyle): string {
  // 用户消息没有该语言版本时用英文，系统提示里已经规定了回答语言
  return STYLE_ASK[style][lang] ?? STYLE_ASK[style].en;
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
  const body: Record<string, unknown> = { model, messages, stream: true, temperature: 0.5, max_tokens: 700 };
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
