"use client";

/**
 * 朗读一段（可能还在流式增长的）文字。
 * 用法：const n = useNarrator(text, lang, streaming); n.play() / n.pause() / n.stop()
 * n.currentIndex 是正在读的句子下标，用来高亮。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { GuideLang } from "@/lib/i18n";
import { GUIDE_LANG_BCP47, pickVoice, speechSupported, splitSentences } from "@/lib/speech";

export type NarratorState = "idle" | "playing" | "paused" | "done";

export function useNarrator(text: string, lang: GuideLang, streaming: boolean) {
  const [state, setState] = useState<NarratorState>("idle");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const supported = speechSupported();

  // 用 ref 存最新的文字和进度，避免 onend 回调里拿到旧值
  const textRef = useRef(text);
  const streamingRef = useRef(streaming);
  const langRef = useRef(lang);
  const nextIdxRef = useRef(0);
  const stateRef = useRef<NarratorState>("idle");
  const speakingRef = useRef(false); // 当前有没有一句在读（含系统排队中）
  const speakNextRef = useRef<() => void>(() => {});

  useEffect(() => {
    textRef.current = text;
    streamingRef.current = streaming;
    langRef.current = lang;
  }, [text, streaming, lang]);

  const setBoth = useCallback((s: NarratorState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  /** 能读的句子：流式中最后一句没写完就先不读 */
  const readySentences = useCallback(() => {
    const { sentences, lastComplete } = splitSentences(textRef.current);
    if (streamingRef.current && !lastComplete) return sentences.slice(0, -1);
    return sentences;
  }, []);

  const speakNext = useCallback(() => {
    if (stateRef.current !== "playing" || speakingRef.current) return;
    const ready = readySentences();
    const idx = nextIdxRef.current;
    if (idx >= ready.length) {
      // 没有新句子：流式还在进行就等（text 变化时会再触发），否则读完了
      if (!streamingRef.current) {
        setBoth("done");
        setCurrentIndex(-1);
      }
      return;
    }
    const u = new SpeechSynthesisUtterance(ready[idx]);
    u.lang = GUIDE_LANG_BCP47[langRef.current];
    const voice = pickVoice(langRef.current);
    if (voice) u.voice = voice;
    u.rate = 1;
    speakingRef.current = true;
    setCurrentIndex(idx);
    const finish = () => {
      speakingRef.current = false;
      nextIdxRef.current = idx + 1;
      // onend 之后再排下一句；用 setTimeout 让浏览器把上一句彻底收尾
      window.setTimeout(() => speakNextRef.current(), 0);
    };
    u.onend = finish;
    u.onerror = (e) => {
      // 被 cancel 打断时也会走到这里，此时不要继续
      if (e.error === "interrupted" || e.error === "canceled") {
        speakingRef.current = false;
        return;
      }
      finish();
    };
    window.speechSynthesis.speak(u);
  }, [readySentences, setBoth]);

  useEffect(() => {
    speakNextRef.current = speakNext;
  }, [speakNext]);

  // 流式期间文字增长：如果正在播且没有句子在读，尝试读新到的句子
  useEffect(() => {
    if (stateRef.current === "playing" && !speakingRef.current) speakNextRef.current();
  }, [text, streaming]);

  const play = useCallback(() => {
    if (!supported) return;
    if (stateRef.current === "paused") {
      window.speechSynthesis.resume();
      setBoth("playing");
      return;
    }
    if (stateRef.current === "done" || stateRef.current === "idle") {
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      nextIdxRef.current = 0;
    }
    setBoth("playing");
    // Chrome 在 cancel 之后立刻 speak 偶尔会丢，稍等一拍
    window.setTimeout(() => speakNextRef.current(), 30);
  }, [supported, setBoth]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setBoth("paused");
  }, [supported, setBoth]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    nextIdxRef.current = 0;
    setBoth("idle");
    setCurrentIndex(-1);
  }, [supported, setBoth]);

  // 换了要读的文字（比如追问出了新回答）：从头开始
  const lastHeadRef = useRef<string>("");
  useEffect(() => {
    const head = text.slice(0, 20);
    const prev = lastHeadRef.current;
    if (prev && head && !text.startsWith(prev)) {
      if (speechSupported()) window.speechSynthesis.cancel();
      speakingRef.current = false;
      nextIdxRef.current = 0;
      setCurrentIndex(-1);
      if (stateRef.current === "done" || stateRef.current === "paused") setBoth("idle");
    }
    lastHeadRef.current = head;
  }, [text, setBoth]);

  // 离开页面时停掉
  useEffect(() => {
    return () => {
      if (speechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  return { supported, state, currentIndex, play, pause, stop };
}
