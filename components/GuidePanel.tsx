"use client";

import { useEffect, useRef, useState } from "react";
import { t, type GuideLang, type Lang } from "@/lib/i18n";
import { audienceStyle, getAudience, getAutoSpeak, resolveGuideLang } from "@/lib/prefs";
import { splitSentences } from "@/lib/speech";
import { useNarrator } from "@/lib/useNarrator";
import { MicIcon, PauseIcon, PlayIcon, SparkIcon } from "@/components/Icons";

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
}

type Turn = { role: "assistant" | "user"; content: string };

/** 详情页的「听导游讲讲」：一键讲解，流式显示，逐句朗读，可以继续追问（打字或按住说话） */
export function GuidePanel({ placeId, uiLang, initialNarration, initialGuideLang, allowFollowUp = true, asrEnabled = false }: Props) {
  const [guideLang, setGuideLang] = useState<GuideLang>(initialGuideLang ?? uiLang);
  const [style, setStyle] = useState<"guide" | "kids">("guide");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [turns, setTurns] = useState<Turn[]>(initialNarration ? [{ role: "assistant", content: initialNarration }] : []);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // 偏好都在 localStorage，只能挂载后读；离线页已经指定了语言就不动
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStyle(audienceStyle(getAudience()));
    setAutoSpeak(getAutoSpeak());
    if (initialGuideLang) return;
    setGuideLang(resolveGuideLang(uiLang));
  }, [uiLang, initialGuideLang]);

  const started = turns.length > 0;
  const lastAssistantIdx = turns.map((x) => x.role).lastIndexOf("assistant");
  const latestNarration = lastAssistantIdx >= 0 ? turns[lastAssistantIdx].content : "";

  // 朗读最新一条讲解
  const narrator = useNarrator(latestNarration, guideLang, streaming);
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoSpeak || !narrator.supported || autoStartedRef.current) return;
    if (streaming && latestNarration.length > 0) {
      autoStartedRef.current = true;
      narrator.play();
    }
  }, [autoSpeak, streaming, latestNarration, narrator]);

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
        body: JSON.stringify({ id: placeId, lang: guideLang, dataLang: uiLang, style, messages: history.length ? history : undefined }),
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

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || streaming) return;
    setQuestion("");
    void run([...turns, { role: "user", content: q }]);
  }

  /* ---------- 按住说话 ---------- */
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canRecord = asrEnabled && typeof window !== "undefined" && "MediaRecorder" in window;

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
  const speakLabel = narrator.state === "playing" ? "pause" : narrator.state === "paused" ? "resume" : "listen";
  const speakButton =
    narrator.supported && latestNarration ? (
      <button
        type="button"
        onClick={() => (narrator.state === "playing" ? narrator.pause() : narrator.play())}
        aria-label={t(uiLang, speakLabel)}
        className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3 text-[12px] font-bold text-bg"
      >
        {narrator.state === "playing" ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        <span>{t(uiLang, speakLabel)}</span>
      </button>
    ) : null;

  const inputPlaceholder =
    voiceState === "recording" ? t(uiLang, "listening") : voiceState === "transcribing" ? t(uiLang, "transcribing") : t(uiLang, "askFollowUp");

  return (
    <section className="flex flex-col gap-4">
      {!started && !streaming && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void run([])}
            className="flex h-14 items-center justify-center gap-2.5 rounded-[18px] bg-ink text-[16px] font-bold text-bg"
          >
            <SparkIcon size={20} />
            <span>{t(uiLang, "askGuide")}</span>
          </button>
          <p className="text-center text-[12px] text-faint">{t(uiLang, "guideHint")}</p>
        </div>
      )}

      {turns.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-accent">
              <SparkIcon size={14} />
              {t(uiLang, initialNarration ? "downloadedGuide" : "askGuide")}
            </span>
            <span className="flex items-center gap-3">
              {speakButton}
              <span className="text-[11px] text-faint">{t(uiLang, "guideDisclaimer")}</span>
            </span>
          </div>
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <p key={i} className="max-w-[85%] self-end rounded-[16px] rounded-br-[6px] bg-surface-2 px-4 py-2.5 text-[14px] leading-6 text-ink">
                {turn.content}
              </p>
            ) : (
              <p key={i} className="min-w-0 whitespace-pre-wrap text-[15px] leading-7 text-ink-soft">
                {i === lastAssistantIdx && turn.content
                  ? splitSentences(turn.content).sentences.map((s, si) => (
                      <span key={si} className={si === narrator.currentIndex ? "rounded bg-accent/15 text-ink" : undefined}>
                        {s}
                      </span>
                    ))
                  : turn.content || (streaming && i === turns.length - 1 ? t(uiLang, "guideThinking") : "")}
                {streaming && i === turns.length - 1 && turn.content && (
                  <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent align-baseline" />
                )}
              </p>
            ),
          )}
        </div>
      )}

      {error && <p className="text-[13px] text-accent">{error}</p>}

      {started && allowFollowUp && (
        <form onSubmit={ask} className="flex flex-col gap-2">
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
                className={`flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-2xl border transition-colors [touch-action:none] ${
                  voiceState === "recording" ? "border-accent bg-accent text-bg" : "border-line bg-surface text-ink"
                } disabled:opacity-60`}
              >
                <MicIcon size={20} />
              </button>
            )}
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={inputPlaceholder}
              maxLength={300}
              disabled={streaming}
              className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-[15px] outline-none focus:border-ink disabled:opacity-60"
            />
            <button type="submit" disabled={streaming || !question.trim()} className="h-12 rounded-2xl bg-ink px-5 text-[15px] font-bold text-bg disabled:opacity-40">
              {t(uiLang, "send")}
            </button>
          </div>
          {voiceError && <p className="text-[13px] text-accent">{voiceError}</p>}
        </form>
      )}
    </section>
  );
}
