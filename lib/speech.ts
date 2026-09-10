"use client";

/**
 * 讲解朗读：用浏览器自带的 speechSynthesis，免费、离线可用。
 * 按句子逐句朗读，一是能边流式输出边读，二是绕开 Chrome 对长段落朗读会中途断掉的老问题。
 */
import type { GuideLang } from "@/lib/i18n";

export const GUIDE_LANG_BCP47: Record<GuideLang, string> = {
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  pt: "pt-BR",
};

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/**
 * 把一段文字切成句子。中英日韩的句号、问号、感叹号和换行都算句尾。
 * 最后一段如果没有句尾标点，视为「还没写完」（流式输出时用）。
 */
export function splitSentences(text: string): { sentences: string[]; lastComplete: boolean } {
  // 英文句号后面跟空格才算句子结束（3.5 这类小数不会被切开），先换成换行再统一切
  const prepared = text.replace(/\.([”」』"')）]*)[ \t]+/g, ".$1\n");
  const parts = prepared.match(/[^。！？!?\n]+[。！？!?]*[”」』"')）]*\s*|\n+/g) ?? [];
  const sentences = parts.map((p) => p.trim()).filter((p) => p.length > 0);
  const tail = sentences[sentences.length - 1] ?? "";
  const lastComplete = /[。！？!?.][”」』"')）]*$/.test(tail);
  return { sentences, lastComplete };
}

let voicesCache: SpeechSynthesisVoice[] | null = null;

function loadVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length) voicesCache = v;
  return voicesCache ?? v;
}

/** 挑一个匹配语言的音色：优先语言代码完全一致的本地音色，其次前缀一致，找不到就交给系统默认 */
export function pickVoice(lang: GuideLang): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;
  const target = GUIDE_LANG_BCP47[lang].toLowerCase();
  const prefix = target.slice(0, 2);
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");
  const exact = voices.filter((v) => norm(v) === target);
  const family = voices.filter((v) => norm(v).startsWith(prefix));
  const pool = exact.length ? exact : family;
  if (!pool.length) return null;
  // 本地音色不依赖网络，优先；同等条件下取系统默认
  return pool.find((v) => v.localService && v.default) ?? pool.find((v) => v.localService) ?? pool.find((v) => v.default) ?? pool[0];
}

/** 部分浏览器 getVoices 是异步填充的，第一次调用可能为空；在 voiceschanged 后再取一次 */
export function onVoicesReady(cb: () => void): () => void {
  if (!speechSupported()) return () => {};
  if (window.speechSynthesis.getVoices().length) {
    cb();
    return () => {};
  }
  const handler = () => cb();
  window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
  return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
}
