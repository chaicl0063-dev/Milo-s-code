"use client";

import { useState } from "react";
import { PERSONA } from "@/lib/personas";
import { DEMO_PLACE, DEMO_STORY } from "@/lib/site/demo";
import type { SitePhoto } from "@/lib/site/photos";
import type { useScriptedSpeech } from "@/components/site/useScriptedSpeech";

type Speech = ReturnType<typeof useScriptedSpeech>;

const T = { ink: "#1F1D1A", accent: "#D9633A", deep: "#A84427", gold: "#C9891C", muted: "#6B645A", line: "#E4D9C8", paper: "#F3ECDF" } as const;

/**
 * I01 · 同一个地点，从看见到听懂：真实地点照片 → 点「Hear its story」→ 讲解 → 一个追问 → 进应用。
 * 图钉、名字、讲解始终是同一个地点。文字随时可读，音频只在点击后出声。
 */
export function PlaceDemo({ photo, appUrl, speech }: { photo: SitePhoto; appUrl: string; speech: Speech }) {
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0 只看到地点；1 讲解出来了；2 追问也答了
  const persona = PERSONA[DEMO_STORY.persona];
  const { state } = speech;
  const base = appUrl.replace(/\/$/, "");

  const hearStory = () => {
    setStep((s) => (s < 1 ? 1 : s));
    void speech.play("story", DEMO_STORY.story.sentences, persona.gender);
  };
  const askFollowUp = () => {
    setStep(2);
    void speech.play("follow", DEMO_STORY.followUp.sentences, persona.gender);
  };

  const controls = (key: string) => {
    if (state.key !== key) return null;
    const dur = state.durationSec ? ` · ${state.durationSec}s` : "";
    if (state.status === "loading") return <span className="text-[11px]" style={{ color: T.muted }}>Preparing audio…</span>;
    if (state.status === "error")
      return (
        <span className="flex items-center gap-2 text-[11px]" style={{ color: T.muted }}>
          Audio unavailable, read along instead.
          <button type="button" onClick={() => (key === "story" ? hearStory() : askFollowUp())} className="font-bold" style={{ color: T.deep }}>
            Retry
          </button>
        </span>
      );
    return (
      <span className="flex items-center gap-2 text-[11px]" style={{ color: T.muted }}>
        <span>
          {state.status === "playing" ? "Playing" : state.status === "paused" ? "Paused" : "Played"}
          {dur}
        </span>
        {state.status === "playing" && (
          <button type="button" onClick={speech.pause} className="font-bold" style={{ color: T.deep }}>
            Pause
          </button>
        )}
        {state.status === "paused" && (
          <button type="button" onClick={speech.resume} className="font-bold" style={{ color: T.deep }}>
            Resume
          </button>
        )}
        {state.status !== "done" && (
          <button type="button" onClick={speech.stop} className="font-bold" style={{ color: T.deep }}>
            Stop
          </button>
        )}
        {state.status === "done" && (
          <button type="button" onClick={() => (key === "story" ? hearStory() : askFollowUp())} className="font-bold" style={{ color: T.deep }}>
            Replay
          </button>
        )}
      </span>
    );
  };

  const bubble = (key: string, sentences: string[]) => {
    const active = state.key === key && (state.status === "playing" || state.status === "paused");
    return (
      <div className="flex items-end gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={persona.image} alt="" aria-hidden width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 max-w-[92%] rounded-[16px] rounded-bl-[6px] px-3.5 py-2.5 text-[13.5px] leading-5" style={{ background: T.paper, color: "#2E2A25" }}>
          {sentences.map((s, i) => (
            <span key={i} className={active && i === state.index ? "rounded" : undefined} style={active && i === state.index ? { background: "rgba(217,99,58,0.16)" } : undefined}>
              {s}{" "}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative -mt-28 mx-3 rounded-[20px] border bg-white/95 p-4 shadow-[0_20px_50px_rgba(31,29,26,0.18)] backdrop-blur md:-mt-32 md:mx-5 md:p-5" style={{ borderColor: T.line }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.muted }}>
        Scripted demo · a real place, sample answers · in the app the guide answers about your surroundings
      </p>

      {/* 地点：真实照片 + 名字 + 图钉，始终指向同一处 */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-[10px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: T.accent }} aria-hidden />
            <span className="truncate font-serif text-[18px]" style={{ color: T.ink }}>
              {DEMO_PLACE.name}
            </span>
          </div>
          <div className="text-[11px]" style={{ color: T.muted }}>
            {DEMO_PLACE.area} ·{" "}
            <a href={photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              real photo
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {step === 0 && (
          <button
            type="button"
            onClick={hearStory}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full px-5 text-[14px] font-bold text-white"
            style={{ background: T.accent }}
          >
            <span className="inline-block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white" aria-hidden />
            {DEMO_STORY.story.prompt}
          </button>
        )}

        {step >= 1 && (
          <>
            <div className="self-end max-w-[85%] rounded-[16px] rounded-br-[6px] px-3.5 py-2 text-[13px] leading-5 text-white" style={{ background: T.ink }}>
              {DEMO_STORY.story.prompt}
            </div>
            {bubble("story", DEMO_STORY.story.sentences)}
            <div className="pl-8">{controls("story")}</div>
          </>
        )}

        {step === 1 && (
          <button
            type="button"
            onClick={askFollowUp}
            className="inline-flex h-10 items-center self-start rounded-full border px-4 text-[13px] font-semibold"
            style={{ borderColor: T.line, color: T.ink, background: "#fff" }}
          >
            {DEMO_STORY.followUp.prompt}
          </button>
        )}

        {step === 2 && (
          <>
            <div className="self-end max-w-[85%] rounded-[16px] rounded-br-[6px] px-3.5 py-2 text-[13px] leading-5 text-white" style={{ background: T.ink }}>
              {DEMO_STORY.followUp.prompt}
            </div>
            {bubble("follow", DEMO_STORY.followUp.sentences)}
            <div className="pl-8">{controls("follow")}</div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <span style={{ color: T.muted }}>
          {step === 0 ? `${persona.name} will tell you about it. Audio starts only when you tap.` : `Same place in the app: real data, ask anything.`}
        </span>
        <span className="flex items-center gap-3">
          {step >= 1 && (
            <a href={`${base}${DEMO_PLACE.appPath}`} className="font-bold" style={{ color: T.deep }}>
              Open this place in the app →
            </a>
          )}
          {step === 2 && (
            <a href={appUrl} className="font-bold" style={{ color: T.deep }}>
              Try it on your own street →
            </a>
          )}
        </span>
      </div>
    </div>
  );
}
