"use client";

import { useRef, useState } from "react";
import { GUIDE_STYLES, type GuideStyle } from "@/lib/guide";
import { t, type Lang } from "@/lib/i18n";
import { SparkIcon } from "@/components/Icons";

interface Props {
  placeId: string;
  lang: Lang;
}

type Turn = { role: "assistant" | "user"; content: string };

const STYLE_KEY = {
  history: "styleHistory",
  architecture: "styleArchitecture",
  stories: "styleStories",
  kids: "styleKids",
} as const;

/** 详情页底部的「听导游讲讲」面板：选风格、流式显示讲解、继续追问 */
export function GuidePanel({ placeId, lang }: Props) {
  const [style, setStyle] = useState<GuideStyle>("history");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const started = turns.length > 0;

  /** 发一次请求并把返回的文本流逐段追加到最后一条 assistant 消息上 */
  async function run(history: Turn[]) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setError(null);
    setTurns([...history, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: placeId, lang, style, messages: history.length ? history : undefined }),
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
      setError(t(lang, err instanceof Error && err.message === "busy" ? "guideBusy" : "guideError"));
      setTurns(history);
    } finally {
      if (abortRef.current === controller) setStreaming(false);
    }
  }

  function start(nextStyle: GuideStyle) {
    setStyle(nextStyle);
    // 换风格等于重新开始讲
    void run([]);
  }

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || streaming) return;
    setQuestion("");
    void run([...turns, { role: "user", content: q }]);
  }

  return (
    <section className="flex flex-col gap-4">
      {/* 风格选择 + 右侧一个不起眼的「AI 生成」标注 */}
      <div className="flex flex-wrap items-center gap-2">
        {GUIDE_STYLES.map((s) => {
          const active = s === style && started;
          return (
            <button
              key={s}
              type="button"
              disabled={streaming}
              onClick={() => start(s)}
              className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                active ? "bg-ink text-bg" : "border border-line bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              {t(lang, STYLE_KEY[s])}
            </button>
          );
        })}
        <span className="ml-auto text-[11px] text-faint">{t(lang, "guideDisclaimer")}</span>
      </div>

      {!started && !streaming && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => start(style)}
            className="flex h-14 items-center justify-center gap-2.5 rounded-[18px] bg-ink text-[16px] font-bold text-bg"
          >
            <SparkIcon size={20} />
            <span>{t(lang, "askGuide")}</span>
          </button>
          <p className="text-center text-[12px] text-faint">{t(lang, "guideHint")}</p>
        </div>
      )}

      {/* 对话 */}
      {turns.length > 0 && (
        <div className="flex flex-col gap-3">
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <p key={i} className="self-end max-w-[85%] rounded-[16px] rounded-br-[6px] bg-surface-2 px-4 py-2.5 text-[14px] leading-6 text-ink">
                {turn.content}
              </p>
            ) : (
              <div key={i} className="flex gap-3">
                <span className="mt-1.5 shrink-0 text-accent">
                  <SparkIcon size={18} />
                </span>
                <p className="min-w-0 whitespace-pre-wrap text-[15px] leading-7 text-ink-soft">
                  {turn.content || (streaming && i === turns.length - 1 ? t(lang, "guideThinking") : "")}
                  {streaming && i === turns.length - 1 && turn.content && (
                    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent align-baseline" />
                  )}
                </p>
              </div>
            ),
          )}
        </div>
      )}

      {error && <p className="text-[13px] text-accent">{error}</p>}

      {/* 追问 */}
      {started && (
        <form onSubmit={ask} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t(lang, "askFollowUp")}
            maxLength={300}
            disabled={streaming}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-[15px] outline-none focus:border-ink disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !question.trim()}
            className="h-12 rounded-2xl bg-ink px-5 text-[15px] font-bold text-bg disabled:opacity-40"
          >
            {t(lang, "send")}
          </button>
        </form>
      )}
    </section>
  );
}
