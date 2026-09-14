"use client";

/**
 * 官网演示用的朗读器：给一组句子，逐句向应用的 /api/tts 取音频，先全部预载再顺序播放，
 * 所以能报总时长，也能在播放时按句高亮。全站同一时间只播一段（切换或再点就停掉上一段）。
 * 只在用户点击后才出声；取不到音频时报错，文字仍然可以直接读。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceGender } from "@/lib/personas";

export type SpeechStatus = "idle" | "loading" | "playing" | "paused" | "done" | "error";

export interface SpeechState {
  /** 正在处理哪段（调用方自定的键，比如 "story" / "mia"） */
  key: string | null;
  status: SpeechStatus;
  /** 正在读第几句，-1 = 还没开始 */
  index: number;
  /** 这段的总时长（秒），预载完才有 */
  durationSec: number | null;
}

const IDLE: SpeechState = { key: null, status: "idle", index: -1, durationSec: null };

/** 读一个音频文件的时长，读不到返回 0 */
function clipDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => resolve(0);
    a.src = url;
  });
}

export function useScriptedSpeech(appUrl: string) {
  const [state, setState] = useState<SpeechState>(IDLE);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const runRef = useRef(0); // 每次 play 递增，旧的异步流程看到不一致就退出
  const urlCache = useRef(new Map<string, string>());
  const base = appUrl.replace(/\/$/, "");

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  };

  const stop = useCallback(() => {
    runRef.current++;
    const a = audioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.pause();
      a.removeAttribute("src");
    }
    setState(IDLE);
  }, []);

  const fetchClip = useCallback(
    async (sentence: string, gender: VoiceGender): Promise<string> => {
      const k = `${gender}:${sentence}`;
      const hit = urlCache.current.get(k);
      if (hit) return hit;
      const res = await fetch(`${base}/api/tts?lang=en&voice=${gender}&text=${encodeURIComponent(sentence)}`);
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      urlCache.current.set(k, url);
      return url;
    },
    [base],
  );

  /** 预载一段并开始播；同一时间只有一段在播 */
  const play = useCallback(
    async (key: string, sentences: string[], gender: VoiceGender) => {
      stop();
      const run = ++runRef.current;
      setState({ key, status: "loading", index: -1, durationSec: null });
      let urls: string[];
      try {
        urls = await Promise.all(sentences.map((s) => fetchClip(s, gender)));
      } catch {
        if (runRef.current === run) setState({ key, status: "error", index: -1, durationSec: null });
        return;
      }
      if (runRef.current !== run) return;
      const durations = await Promise.all(urls.map(clipDuration));
      if (runRef.current !== run) return;
      const total = durations.reduce((s, d) => s + d, 0);
      setState({ key, status: "playing", index: 0, durationSec: Math.round(total) });

      const a = getAudio();
      const playIndex = (i: number) => {
        if (runRef.current !== run) return;
        if (i >= urls.length) {
          setState({ key, status: "done", index: urls.length - 1, durationSec: Math.round(total) });
          return;
        }
        setState((prev) => ({ ...prev, index: i, status: "playing" }));
        a.onended = () => playIndex(i + 1);
        a.onerror = () => playIndex(i + 1);
        a.src = urls[i];
        a.play().catch(() => {
          if (runRef.current === run) setState({ key, status: "error", index: i, durationSec: Math.round(total) });
        });
      };
      playIndex(0);
    },
    [fetchClip, stop],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((prev) => (prev.status === "playing" ? { ...prev, status: "paused" } : prev));
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setState((prev) => (prev.status === "paused" ? { ...prev, status: "playing" } : prev));
  }, []);

  // 离开页面：停掉并释放地址
  useEffect(() => {
    const cache = urlCache.current;
    return () => {
      audioRef.current?.pause();
      cache.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  return { state, play, pause, resume, stop };
}
