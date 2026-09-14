"use client";

/**
 * 官网演示用的朗读器：给一组句子，逐句向应用的 /api/tts 取音频，先全部预载再顺序播放，
 * 所以能报总时长，也能在播放时按句高亮。全站同一时间只播一段（切换或再点就停掉上一段）。
 * 只在用户点击后才出声；取不到音频或中途失败进入可重试的 error，文字仍然可以直接读。
 *
 * 每次 play 有一个运行编号：停止、切换、离开页面都会让编号失效，迟到的请求和回调看到编号不对就退出，
 * 迟到的音频地址直接释放，不会在用户已经离开后突然出声（COLLABORATION S02）。
 * 「正在播放」以音频元素的 playing 事件为准，恢复播放被拒绝时不会显示成播放中（S03）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VoiceGender } from "@/lib/personas";
import { createRunGuard } from "@/lib/runGuard";

export type SpeechStatus = "idle" | "loading" | "playing" | "paused" | "done" | "error";

export interface SpeechState {
  /** 正在处理哪段（调用方自定的键，比如 "story" / "mia"） */
  key: string | null;
  status: SpeechStatus;
  /** 正在读第几句，-1 = 还没开始 */
  index: number;
  /** 这段的总时长（秒），预载完才有；读不到为 null */
  durationSec: number | null;
}

const IDLE: SpeechState = { key: null, status: "idle", index: -1, durationSec: null };
const METADATA_TIMEOUT_MS = 3000;

/** 读一个音频文件的时长；读不到或超时返回 NaN，不让「准备中」卡死 */
function clipDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    let settled = false;
    const finish = (v: number) => {
      if (settled) return;
      settled = true;
      a.onloadedmetadata = null;
      a.onerror = null;
      a.removeAttribute("src");
      resolve(v);
    };
    const timer = window.setTimeout(() => finish(NaN), METADATA_TIMEOUT_MS);
    a.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish(Number.isFinite(a.duration) ? a.duration : NaN);
    };
    a.onerror = () => {
      window.clearTimeout(timer);
      finish(NaN);
    };
    a.src = url;
  });
}

export function useScriptedSpeech(appUrl: string) {
  const [state, setState] = useState<SpeechState>(IDLE);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const guard = useMemo(() => createRunGuard(), []); // 每次 play / stop / 卸载开新一轮，旧的异步流程看到不一致就退出
  const abortRef = useRef<AbortController | null>(null);
  const urlCache = useRef(new Map<string, string>());
  const base = appUrl.replace(/\/$/, "");

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  };

  /** 停掉当前输出并让所有在途流程失效 */
  const halt = useCallback(() => {
    guard.next();
    abortRef.current?.abort();
    abortRef.current = null;
    const a = audioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.onplaying = null;
      a.pause();
      a.removeAttribute("src");
    }
  }, [guard]);

  const stop = useCallback(() => {
    halt();
    setState(IDLE);
  }, [halt]);

  const fetchClip = useCallback(
    async (sentence: string, gender: VoiceGender, signal: AbortSignal, run: number): Promise<string> => {
      const k = `${gender}:${sentence}`;
      const hit = urlCache.current.get(k);
      if (hit) return hit;
      const res = await fetch(`${base}/api/tts?lang=en&voice=${gender}&text=${encodeURIComponent(sentence)}`, { signal });
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (!guard.isCurrent(run)) {
        // 迟到的资源：用户已经停止或离开，直接释放，不进缓存
        URL.revokeObjectURL(url);
        throw new Error("stale");
      }
      urlCache.current.set(k, url);
      return url;
    },
    [base, guard],
  );

  /** 预载一段并开始播；同一时间只有一段在播 */
  const play = useCallback(
    async (key: string, sentences: string[], gender: VoiceGender) => {
      halt();
      const run = guard.current();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ key, status: "loading", index: -1, durationSec: null });

      const keys = sentences.map((s) => `${gender}:${s}`);
      let urls: string[];
      try {
        urls = await Promise.all(sentences.map((s) => fetchClip(s, gender, controller.signal, run)));
      } catch {
        if (guard.isCurrent(run)) setState({ key, status: "error", index: -1, durationSec: null });
        return;
      }
      if (!guard.isCurrent(run)) return;
      const durations = await Promise.all(urls.map(clipDuration));
      if (!guard.isCurrent(run)) return;
      const total = durations.every(Number.isFinite) ? Math.round(durations.reduce((s, d) => s + d, 0)) : null;
      // 读不出时长的文件大概率是坏的：先从缓存去掉，播成功再放回去，播失败就释放；Retry 因此会重新请求
      durations.forEach((d, i) => {
        if (!Number.isFinite(d)) urlCache.current.delete(keys[i]);
      });

      const a = getAudio();
      const playIndex = (i: number) => {
        if (!guard.isCurrent(run)) return;
        if (i >= urls.length) {
          setState({ key, status: "done", index: urls.length - 1, durationSec: total });
          return;
        }
        // 「正在播放」以 playing 事件为准；启动或中途失败进入可重试的 error，不跳句；
        // 坏掉的音频从缓存里去掉，Retry 会重新请求而不是再放一次坏文件
        const fail = () => {
          if (!guard.isCurrent(run)) return;
          urlCache.current.delete(keys[i]);
          URL.revokeObjectURL(urls[i]);
          setState({ key, status: "error", index: i, durationSec: total });
        };
        a.onplaying = () => {
          if (!guard.isCurrent(run)) return;
          urlCache.current.set(keys[i], urls[i]);
          setState({ key, status: "playing", index: i, durationSec: total });
        };
        a.onended = () => playIndex(i + 1);
        a.onerror = fail;
        a.src = urls[i];
        a.play().catch(fail);
      };
      playIndex(0);
    },
    [fetchClip, halt, guard],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((prev) => (prev.status === "playing" ? { ...prev, status: "paused" } : prev));
  }, []);

  /** 恢复：成功启动（playing 事件）才显示播放中；被拒绝进入 error */
  const resume = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const run = guard.current();
    a.play().catch(() => {
      if (guard.isCurrent(run)) setState((prev) => ({ ...prev, status: "error" }));
    });
  }, [guard]);

  // 离开页面：让在途流程失效、停掉输出、释放地址
  useEffect(() => {
    const cache = urlCache.current;
    return () => {
      halt();
      cache.forEach((u) => URL.revokeObjectURL(u));
      cache.clear();
    };
  }, [halt]);

  return { state, play, pause, resume, stop };
}
