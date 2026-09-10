"use client";

/**
 * 朗读一段（可能还在流式增长的）文字，按句子逐句读。
 * 两个引擎：
 *  - cloud   ：/api/tts 合成的神经网络语音（自然，需联网），边读这句边预取下一句
 *  - browser ：手机自带 speechSynthesis（兜底，离线可用）
 * 用法：const n = useNarrator(text, lang, streaming, engine); n.play() / n.pause() / n.stop()
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { GuideLang } from "@/lib/i18n";
import { GUIDE_LANG_BCP47, pickVoice, speechSupported, splitSentences } from "@/lib/speech";
import type { VoiceGender } from "@/lib/personas";

/** blocked = 浏览器不允许没有用户手势就出声（手机上常见），等用户点一下再继续 */
export type NarratorState = "idle" | "playing" | "paused" | "done" | "blocked";
export type VoiceEngine = "cloud" | "browser";

/** 0.05 秒的静音 WAV（data URL），只用来在手势里解锁音频元素 */
const SILENT_WAV = (() => {
  const samples = 2205;
  const buf = new ArrayBuffer(44 + samples * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + samples * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 44100, true);
  v.setUint32(28, 44100 * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples * 2, true);
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return typeof btoa === "function" ? `data:audio/wav;base64,${btoa(bin)}` : "";
})();

export function useNarrator(text: string, lang: GuideLang, streaming: boolean, engine: VoiceEngine = "cloud", voice: VoiceGender = "female") {
  const [state, setState] = useState<NarratorState>("idle");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const browserOk = speechSupported();
  const supported = browserOk || typeof Audio !== "undefined";

  // 用 ref 存最新值，避免异步回调里拿到旧的
  const textRef = useRef(text);
  const streamingRef = useRef(streaming);
  const langRef = useRef(lang);
  const engineRef = useRef<VoiceEngine>(engine);
  const voiceRef = useRef<VoiceGender>(voice);
  const nextIdxRef = useRef(0);
  const stateRef = useRef<NarratorState>("idle");
  const busyRef = useRef(false); // 当前有没有一句在读或在取
  const speakNextRef = useRef<() => void>(() => {});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCacheRef = useRef<Map<string, Promise<string | null>>>(new Map());
  const cloudFailedRef = useRef(false); // 云端失败后本次朗读退回系统语音

  useEffect(() => {
    textRef.current = text;
    streamingRef.current = streaming;
    langRef.current = lang;
    engineRef.current = engine;
    voiceRef.current = voice;
  }, [text, streaming, lang, engine, voice]);

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

  /** 取某句的音频地址（带缓存），失败返回 null */
  const fetchAudioUrl = useCallback((sentence: string): Promise<string | null> => {
    const key = `${langRef.current}:${voiceRef.current}:${sentence}`;
    const cached = urlCacheRef.current.get(key);
    if (cached) return cached;
    const p = fetch(`/api/tts?lang=${langRef.current}&voice=${voiceRef.current}&text=${encodeURIComponent(sentence)}`)
      .then(async (r) => (r.ok ? URL.createObjectURL(await r.blob()) : null))
      .catch(() => null);
    urlCacheRef.current.set(key, p);
    return p;
  }, []);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "auto";
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  const speakNext = useCallback(() => {
    if (stateRef.current !== "playing" || busyRef.current) return;
    const ready = readySentences();
    const idx = nextIdxRef.current;
    if (idx >= ready.length) {
      if (!streamingRef.current) {
        setBoth("done");
        setCurrentIndex(-1);
      }
      return;
    }
    const sentence = ready[idx];
    busyRef.current = true;
    setCurrentIndex(idx);
    const finish = () => {
      busyRef.current = false;
      nextIdxRef.current = idx + 1;
      window.setTimeout(() => speakNextRef.current(), 0);
    };

    const useCloud = engineRef.current === "cloud" && !cloudFailedRef.current && typeof Audio !== "undefined";
    if (useCloud) {
      // 先把下一句也排上，等这句播完能无缝接上
      if (ready[idx + 1]) void fetchAudioUrl(ready[idx + 1]);
      void fetchAudioUrl(sentence).then((url) => {
        if (stateRef.current !== "playing" && stateRef.current !== "paused") {
          busyRef.current = false;
          return;
        }
        if (!url) {
          // 云端拿不到：这次朗读剩下的句子用系统语音
          cloudFailedRef.current = true;
          busyRef.current = false;
          speakNextRef.current();
          return;
        }
        const a = getAudio();
        a.onended = finish;
        a.onerror = finish;
        a.src = url;
        a.play().catch((err: unknown) => {
          // 没有用户手势不许自动播放：停在这一句，等用户点「播放」再从这句继续
          if (err instanceof Error && err.name === "NotAllowedError") {
            busyRef.current = false;
            setBoth("blocked");
            return;
          }
          finish();
        });
      });
      return;
    }

    if (!browserOk) {
      finish();
      return;
    }
    const u = new SpeechSynthesisUtterance(sentence);
    u.lang = GUIDE_LANG_BCP47[langRef.current];
    const voice = pickVoice(langRef.current);
    if (voice) u.voice = voice;
    u.onend = finish;
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        busyRef.current = false;
        return;
      }
      finish();
    };
    window.speechSynthesis.speak(u);
  }, [readySentences, setBoth, fetchAudioUrl, getAudio, browserOk]);

  useEffect(() => {
    speakNextRef.current = speakNext;
  }, [speakNext]);

  // 流式期间文字增长：如果正在播且空闲，读新到的句子
  useEffect(() => {
    if (stateRef.current === "playing" && !busyRef.current) speakNextRef.current();
  }, [text, streaming]);

  const haltOutput = useCallback(() => {
    if (browserOk) window.speechSynthesis.cancel();
    const a = audioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.pause();
      a.removeAttribute("src");
    }
    busyRef.current = false;
  }, [browserOk]);

  /** 在用户手势里先「解锁」音频元素：手机浏览器只允许手势里开始的播放，之后同一个元素就可以由代码控制 */
  const unlock = useCallback(() => {
    if (typeof Audio === "undefined") return;
    const a = getAudio();
    if (stateRef.current === "playing" || busyRef.current) return;
    if (!a.src) a.src = SILENT_WAV;
    a.play()
      .then(() => {
        if (a.src === SILENT_WAV) {
          a.pause();
          a.removeAttribute("src");
        }
      })
      .catch(() => {});
  }, [getAudio]);

  const play = useCallback(() => {
    if (!supported) return;
    if (stateRef.current === "blocked") {
      setBoth("playing");
      window.setTimeout(() => speakNextRef.current(), 0);
      return;
    }
    if (stateRef.current === "paused") {
      if (engineRef.current === "cloud" && !cloudFailedRef.current && audioRef.current?.src) {
        audioRef.current.play().catch(() => {});
      } else if (browserOk) {
        window.speechSynthesis.resume();
      }
      setBoth("playing");
      return;
    }
    if (stateRef.current === "done" || stateRef.current === "idle") {
      haltOutput();
      nextIdxRef.current = 0;
      cloudFailedRef.current = false;
    }
    setBoth("playing");
    window.setTimeout(() => speakNextRef.current(), 30);
  }, [supported, browserOk, setBoth, haltOutput]);

  const pause = useCallback(() => {
    if (!supported) return;
    if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
    if (browserOk) window.speechSynthesis.pause();
    setBoth("paused");
  }, [supported, browserOk, setBoth]);

  const stop = useCallback(() => {
    if (!supported) return;
    haltOutput();
    nextIdxRef.current = 0;
    setBoth("idle");
    setCurrentIndex(-1);
  }, [supported, setBoth, haltOutput]);

  // 换了要读的文字（比如追问出了新回答）：从头开始
  const lastHeadRef = useRef<string>("");
  useEffect(() => {
    const head = text.slice(0, 20);
    const prev = lastHeadRef.current;
    if (prev && head && !text.startsWith(prev)) {
      haltOutput();
      nextIdxRef.current = 0;
      setCurrentIndex(-1);
      if (stateRef.current === "done" || stateRef.current === "paused") setBoth("idle");
    }
    lastHeadRef.current = head;
  }, [text, setBoth, haltOutput]);

  // 离开页面：停掉并释放音频地址
  useEffect(() => {
    const cache = urlCacheRef.current;
    return () => {
      if (speechSupported()) window.speechSynthesis.cancel();
      audioRef.current?.pause();
      cache.forEach((p) => p.then((u) => u && URL.revokeObjectURL(u)));
    };
  }, []);

  return { supported, state, currentIndex, play, pause, stop, unlock };
}
