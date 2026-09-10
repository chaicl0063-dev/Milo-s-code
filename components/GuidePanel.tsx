"use client";

import { useEffect, useRef, useState } from "react";
import { t, type GuideLang, type Lang } from "@/lib/i18n";
import { audienceStyle, getAudience, getAutoSpeak, getPersona, getVoiceEngine, resolveGuideLang, type VoiceEnginePref } from "@/lib/prefs";
import { DEFAULT_PERSONA, PERSONA, type PersonaId } from "@/lib/personas";
import { splitSentences } from "@/lib/speech";
import { useNarrator } from "@/lib/useNarrator";
import { MicIcon, PlayIcon, SparkIcon, SpeakerIcon, SpeakerOffIcon } from "@/components/Icons";
import { PersonaAvatar } from "@/components/PersonaPicker";

interface Props {
  placeId: string;
  /** 界面语言；讲解语言默认跟它，用户在「我的」里另设过就用设的 */
  uiLang: Lang;
  /** 离线阅读页传入已下载的讲解，面板直接显示它而不是「听导游讲讲」按钮 */
  initialNarration?: string;
  initialGuideLang?: GuideLang;
  /** 没网时关掉追问 */
  allowFollowUp?: boolean;
  /** 服务端配了语音识别才显示「按住说话」 */
  asrEnabled?: boolean;
  /** 进来就自动开讲，不用再点按钮 */
  autoStart?: boolean;
  /**
   * inline：嵌在别的页面里（离线阅读页），提问栏折叠成一行；
   * page：独占一页的对话（/talk），提问栏固定在屏幕底部，外层要留出 bottomInset 的空白
   */
  layout?: "inline" | "page";
}

type Turn = { role: "assistant" | "user"; content: string };

/** 某个地点的对话存 sessionStorage：从详情页来回、切 tab 都还在，关掉应用就清 */
const talkKey = (placeId: string, lang: string) => `tourguide.talk:${lang}:${placeId}`;
function loadTurns(placeId: string, lang: string): Turn[] {
  try {
    const raw = window.sessionStorage.getItem(talkKey(placeId, lang));
    const turns = raw ? (JSON.parse(raw) as Turn[]) : [];
    return Array.isArray(turns) ? turns.filter((x) => x && typeof x.content === "string" && x.content) : [];
  } catch {
    return [];
  }
}
function saveTurns(placeId: string, lang: string, turns: Turn[]): void {
  try {
    window.sessionStorage.setItem(talkKey(placeId, lang), JSON.stringify(turns));
  } catch {
    /* 隐私模式 */
  }
}

/** page 布局下固定在底部的提问栏高度，外层页面按它留白 */
export const TALK_INPUT_HEIGHT = 72;

/**
 * 讲解对话：聊天式布局，导游在左（浅底气泡带头像），你在右（深底气泡）。
 * 进入对话默认朗读，标题行一个静音按钮。文字跟着声音走：正在读哪句就显示到哪句，静音时全部显示。
 * 手机浏览器不允许没有手势就出声时，显示「轻点开始播放」。
 */
export function GuidePanel({ placeId, uiLang, initialNarration, initialGuideLang, allowFollowUp = true, asrEnabled = false, autoStart = false, layout = "inline" }: Props) {
  const [guideLang, setGuideLang] = useState<GuideLang>(initialGuideLang ?? uiLang);
  const [style, setStyle] = useState<"guide" | "kids">("guide");
  const [muted, setMuted] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<VoiceEnginePref>("cloud");
  const [persona, setPersonaState] = useState<PersonaId>(DEFAULT_PERSONA);
  const [prefsReady, setPrefsReady] = useState(false);
  const [turns, setTurns] = useState<Turn[]>(initialNarration ? [{ role: "assistant", content: initialNarration }] : []);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(layout === "page");
  const [question, setQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 偏好都在 localStorage，只能挂载后读；离线页已经指定了语言就不动
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStyle(audienceStyle(getAudience()));
    setMuted(!getAutoSpeak());
    setVoiceEngine(getVoiceEngine());
    setPersonaState(getPersona());
    if (!initialGuideLang) setGuideLang(resolveGuideLang(uiLang));
    // 离线页有自己的讲解；其他情况恢复这次会话里聊过的
    if (!initialNarration) {
      const saved = loadTurns(placeId, uiLang);
      if (saved.length) setTurns(saved);
    }
    setPrefsReady(true);
  }, [uiLang, initialGuideLang, initialNarration, placeId]);

  // 生成完了就存一份
  useEffect(() => {
    if (!prefsReady || streaming || initialNarration || turns.length === 0) return;
    saveTurns(placeId, uiLang, turns);
  }, [turns, streaming, prefsReady, initialNarration, placeId, uiLang]);

  const started = turns.length > 0;
  const lastAssistantIdx = turns.map((x) => x.role).lastIndexOf("assistant");
  const latestNarration = lastAssistantIdx >= 0 ? turns[lastAssistantIdx].content : "";

  // 朗读最新一条讲解：没静音就自动开始
  const narrator = useNarrator(latestNarration, guideLang, streaming, voiceEngine, PERSONA[persona].gender);
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (muted || !narrator.supported || autoStartedRef.current) return;
    if (latestNarration.length > 0 && (streaming || initialNarration)) {
      autoStartedRef.current = true;
      narrator.play();
    }
  }, [muted, streaming, latestNarration, narrator, initialNarration]);

  function toggleMute() {
    if (muted) {
      setMuted(false);
      narrator.unlock();
      narrator.play();
    } else {
      setMuted(true);
      narrator.pause();
    }
  }

  /** 发一次请求并把返回的文本流逐段追加到最后一条 assistant 消息上 */
  async function run(history: Turn[]) {
    abortRef.current?.abort();
    narrator.stop();
    autoStartedRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setError(null);
    setTurns([...history, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: placeId, lang: guideLang, dataLang: uiLang, style, persona, messages: history.length ? history : undefined }),
        signal: controller.signal,
      });
      if (res.status === 429) throw new Error("busy");
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setTurns([...history, { role: "assistant", content: text }]);
      }
      if (!text.trim()) throw new Error("empty");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(t(uiLang, err instanceof Error && err.message === "busy" ? "guideBusy" : "guideError"));
      setTurns(history);
    } finally {
      if (abortRef.current === controller) setStreaming(false);
    }
  }

  // 自动开讲：偏好读完后跑一次
  const autoRunRef = useRef(false);
  useEffect(() => {
    if (!autoStart || !prefsReady || autoRunRef.current || started) return;
    autoRunRef.current = true;
    void run([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, prefsReady]);

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || streaming) return;
    setQuestion("");
    narrator.unlock();
    void run([...turns, { role: "user", content: q }]);
  }

  function openAsk() {
    setAskOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  /* ---------- 按住说话 ---------- */
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canRecord = prefsReady && asrEnabled && typeof window !== "undefined" && "MediaRecorder" in window;

  async function startRecording() {
    if (voiceState !== "idle") return;
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 1000) {
          setVoiceState("idle");
          return;
        }
        setVoiceState("transcribing");
        try {
          const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
          const form = new FormData();
          form.append("audio", blob, `question.${ext}`);
          form.append("lang", guideLang);
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { text?: string };
          if (data.text?.trim()) setQuestion(data.text.trim());
          else setVoiceError(t(uiLang, "asrFailed"));
        } catch {
          setVoiceError(t(uiLang, "asrFailed"));
        } finally {
          setVoiceState("idle");
        }
      };
      recorderRef.current = rec;
      rec.start();
      setVoiceState("recording");
    } catch {
      setVoiceError(t(uiLang, "micDenied"));
    }
  }

  function stopRecording() {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
  }

  /* ---------- 渲染 ---------- */
  const inputPlaceholder =
    voiceState === "recording" ? t(uiLang, "listening") : voiceState === "transcribing" ? t(uiLang, "transcribing") : t(uiLang, "askFollowUp");
  // 文字跟着声音走：正在朗读时只显示到当前句；静音、被浏览器拦住、读完了就全显示
  const following = !muted && narrator.supported && (narrator.state === "playing" || narrator.state === "paused");
  const blocked = !muted && narrator.state === "blocked";
  const isPage = layout === "page";

  const inputForm = allowFollowUp && (
    <form onSubmit={ask} className="flex flex-col gap-1">
      <div className="flex gap-2">
        {canRecord && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              void startRecording();
            }}
            onPointerUp={stopRecording}
            onPointerLeave={stopRecording}
            onPointerCancel={stopRecording}
            disabled={streaming || voiceState === "transcribing"}
            aria-label={t(uiLang, "holdToTalk")}
            title={t(uiLang, "holdToTalk")}
            className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full border transition-colors [touch-action:none] ${
              voiceState === "recording" ? "border-accent bg-accent text-bg" : "border-line bg-surface text-ink"
            } disabled:opacity-60`}
          >
            <MicIcon size={20} />
          </button>
        )}
        <input
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={inputPlaceholder}
          maxLength={300}
          disabled={streaming}
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] outline-none focus:border-ink disabled:opacity-60"
        />
        <button type="submit" disabled={streaming || !question.trim()} className="h-11 rounded-full bg-ink px-4 text-[14px] font-bold text-bg disabled:opacity-40">
          {t(uiLang, "send")}
        </button>
      </div>
      {voiceError && <p className="text-[12px] text-accent">{voiceError}</p>}
    </form>
  );

  return (
    <section className="flex flex-col gap-3">
      {!started && !streaming && !autoStart && (
        <button
          type="button"
          onClick={() => {
            narrator.unlock();
            void run([]);
          }}
          className="flex h-14 items-center justify-center gap-2.5 rounded-[18px] bg-ink text-[16px] font-bold text-bg"
        >
          <SparkIcon size={20} />
          <span>{t(uiLang, "askGuide")}</span>
        </button>
      )}

      {(started || streaming || autoStart) && (
        <>
          {/* 对话区标题行：导游 · 静音 · AI 生成 */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-accent">
              <PersonaAvatar id={persona} size={22} />
              {prefsReady ? PERSONA[persona].name : ""}
              {initialNarration && <span className="font-semibold normal-case tracking-normal text-faint">· {t(uiLang, "downloadedGuide")}</span>}
            </span>
            <span className="flex items-center gap-3">
              {/* 有没有音频能力只有浏览器知道，等挂载后再画静音按钮，避免服务端和客户端渲染不一致 */}
              {prefsReady && narrator.supported && (
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-pressed={muted}
                  aria-label={t(uiLang, muted ? "unmute" : "mute")}
                  title={t(uiLang, muted ? "unmute" : "mute")}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${muted ? "bg-surface-2 text-muted" : "bg-ink text-bg"}`}
                >
                  {muted ? <SpeakerOffIcon size={16} /> : <SpeakerIcon size={16} />}
                </button>
              )}
              <span className="text-[11px] text-faint">{t(uiLang, "guideDisclaimer")}</span>
            </span>
          </div>

          {/* 浏览器拦住了自动出声：让用户点一下 */}
          {blocked && (
            <button
              type="button"
              onClick={() => {
                narrator.unlock();
                narrator.play();
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent text-[14px] font-bold text-bg"
            >
              <PlayIcon size={16} />
              {t(uiLang, "tapToListen")}
            </button>
          )}

          {/* 气泡 */}
          <div className="flex flex-col gap-3">
            {turns.map((turn, i) => {
              if (turn.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[86%] whitespace-pre-wrap rounded-[18px] rounded-br-[6px] bg-ink px-4 py-2.5 text-[15px] leading-6 text-bg">{turn.content}</p>
                  </div>
                );
              }
              const isLatest = i === lastAssistantIdx;
              const isLastTurn = i === turns.length - 1;
              const sentences = isLatest && turn.content ? splitSentences(turn.content).sentences : [];
              const visible = isLatest && following ? sentences.slice(0, Math.max(0, narrator.currentIndex + 1)) : sentences;
              const waiting = isLatest && (!turn.content || (following && visible.length === 0));
              return (
                <div key={i} className="flex items-end gap-2">
                  <PersonaAvatar id={persona} size={28} />
                  <p className="min-w-0 max-w-[86%] whitespace-pre-wrap rounded-[18px] rounded-bl-[6px] bg-surface-2 px-4 py-3 text-[15px] leading-7 text-ink-soft">
                    {isLatest
                      ? waiting
                        ? streaming || following
                          ? t(uiLang, "guideThinking")
                          : ""
                        : visible.map((s, si, arr) => (
                            <span key={si} className={si === narrator.currentIndex && following ? "rounded bg-accent/15 text-ink" : undefined}>
                              {s}
                              {/* 切句时去掉了句间空格，非中日文句子后面补回来 */}
                              {si < arr.length - 1 && !/[。！？」』”]$/.test(s) ? " " : ""}
                            </span>
                          ))
                      : turn.content}
                    {streaming && isLastTurn && turn.content && !following && (
                      <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent align-baseline" />
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          {error && <p className="text-[13px] text-accent">{error}</p>}

          {/* 提问：inline 布局默认折叠成一行；page 布局固定在屏幕底部 */}
          {allowFollowUp &&
            (isPage ? (
              <div className="fixed inset-x-0 bottom-0 z-[1001] mx-auto max-w-[520px] bg-bg/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">{inputForm}</div>
            ) : askOpen ? (
              inputForm
            ) : (
              <button
                type="button"
                onClick={openAsk}
                disabled={streaming}
                className="flex h-10 items-center gap-2 self-start rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-muted disabled:opacity-60"
              >
                {canRecord ? <MicIcon size={16} /> : null}
                {t(uiLang, "askFollowUp")}
              </button>
            ))}
        </>
      )}
    </section>
  );
}
