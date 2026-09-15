"use client";

import { useState } from "react";
import { PERSONA } from "@/lib/personas";
import { DEMO_PLACE, DEMO_STORY } from "@/lib/site/demo";
import type { SitePhoto } from "@/lib/site/photos";
import type { useScriptedSpeech } from "@/components/site/useScriptedSpeech";
import { T } from "@/lib/site/theme";

type Speech = ReturnType<typeof useScriptedSpeech>;

/**
 * I01 · 同一个地点，从看见到听懂：真实地点照片 → 点「Hear the story」→ 讲解 → 一个追问 → 进应用。
 * 图钉、名字、讲解始终是同一个地点。文字随时可读，音频只在点击后出声。
 * 2026-09-15 按实施规格 §3 S04：正常文档流的白底 1px 边框（不再叠在照片上）；
 * 播放前就能读到样本首句；按钮展示名 Hear the story（仍走原 hearStory）。
 */
export function PlaceDemo({ photo, appUrl, speech }: { photo: SitePhoto; appUrl: string; speech: Speech }) {
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0 只看到地点与样本首句；1 讲解出来了；2 追问也答了
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

  const replay = (key: string) => (key === "story" ? hearStory() : askFollowUp());

  const link = "text-[13px] font-semibold underline-offset-2 hover:underline";

  /** 每段自己的操作：不是当前播放段时始终给「Play this part」，播放键只控制当前段（S01） */
  const controls = (key: string) => {
    if (state.key !== key) {
      return (
        <button type="button" onClick={() => replay(key)} className={link} style={{ color: T.accent }}>
          ▶ Play this part
        </button>
      );
    }
    const dur = state.durationSec ? ` · ${state.durationSec}s` : "";
    if (state.status === "loading")
      return (
        <span className="flex items-center gap-3 text-[13px]" style={{ color: T.muted }}>
          Preparing audio…
          <button type="button" onClick={speech.stop} className={link} style={{ color: T.accent }}>
            Cancel
          </button>
        </span>
      );
    if (state.status === "error")
      return (
        <span className="flex flex-wrap items-center gap-3 text-[13px]" style={{ color: T.muted }}>
          {state.index >= 0 ? "Audio stopped partway, the text is complete above." : "Audio unavailable, read along instead."}
          <button type="button" onClick={() => replay(key)} className={link} style={{ color: T.accent }}>
            Retry
          </button>
        </span>
      );
    return (
      <span className="flex flex-wrap items-center gap-3 text-[13px]" style={{ color: T.muted }}>
        <span>
          {state.status === "playing" ? "Playing" : state.status === "paused" ? "Paused" : "Played"}
          {dur}
        </span>
        {state.status === "playing" && (
          <button type="button" onClick={speech.pause} className={link} style={{ color: T.accent }}>
            Pause
          </button>
        )}
        {state.status === "paused" && (
          <button type="button" onClick={speech.resume} className={link} style={{ color: T.accent }}>
            Resume
          </button>
        )}
        {state.status !== "done" && (
          <button type="button" onClick={speech.stop} className={link} style={{ color: T.accent }}>
            Stop
          </button>
        )}
        {state.status === "done" && (
          <button type="button" onClick={() => replay(key)} className={link} style={{ color: T.accent }}>
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
        <div className="min-w-0 max-w-[92%] rounded-[16px] rounded-bl-[6px] px-3.5 py-2.5 text-[15px] leading-6" style={{ background: T.paper, color: T.ink }}>
          {sentences.map((s, i) => (
            <span key={i} className={active && i === state.index ? "rounded" : undefined} style={active && i === state.index ? { background: T.accentSoft } : undefined}>
              {s}{" "}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-[20px] border p-4 md:p-5" style={{ borderColor: T.line, background: T.white }}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: T.muted }}>
        Scripted demo · a real place, sample answers
      </p>

      {/* 地点：真实照片 + 名字 + 图钉，始终指向同一处 */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-[12px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt} width={80} height={56} loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: T.accent }} aria-hidden />
            <span className="truncate text-[18px] font-semibold tracking-[-0.02em]" style={{ color: T.ink }}>
              {DEMO_PLACE.name}
            </span>
          </div>
          <div className="text-[13px]" style={{ color: T.muted }}>
            {DEMO_PLACE.area} ·{" "}
            <a href={photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              real photo
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {step === 0 && (
          <>
            {/* 播放前就能读：样本首句（点击后由完整讲解替代，不重复显示） */}
            <div className="flex items-end gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={persona.image} alt="" aria-hidden width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover" />
              <div className="min-w-0 max-w-[92%] rounded-[16px] rounded-bl-[6px] px-3.5 py-2.5 text-[15px] leading-6" style={{ background: T.paper, color: T.ink }}>
                {DEMO_STORY.story.sentences[0]}
                <span className="mt-1 block text-[12px]" style={{ color: T.muted }}>
                  Sample first sentence · {persona.name}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={hearStory}
              className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full px-6 text-[15px] font-semibold text-white transition-colors"
              style={{ background: T.accent }}
            >
              <span className="inline-block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white" aria-hidden />
              Hear the story
            </button>
          </>
        )}

        {step >= 1 && (
          <>
            <div className="max-w-[85%] self-end rounded-[16px] rounded-br-[6px] px-3.5 py-2 text-[14px] leading-5 text-white" style={{ background: T.ink }}>
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
            className="inline-flex h-11 items-center self-start rounded-full border px-5 text-[14px] font-semibold"
            style={{ borderColor: T.line, color: T.ink, background: T.white }}
          >
            {DEMO_STORY.followUp.prompt}
          </button>
        )}

        {step === 2 && (
          <>
            <div className="max-w-[85%] self-end rounded-[16px] rounded-br-[6px] px-3.5 py-2 text-[14px] leading-5 text-white" style={{ background: T.ink }}>
              {DEMO_STORY.followUp.prompt}
            </div>
            {bubble("follow", DEMO_STORY.followUp.sentences)}
            <div className="pl-8">{controls("follow")}</div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span style={{ color: T.muted }}>
          {step === 0 ? `${persona.name}'s real voice. Audio starts only when you tap.` : "Same place in the app: real data, ask anything."}
        </span>
        <span className="flex items-center gap-3">
          {step >= 1 && (
            <a href={`${base}${DEMO_PLACE.appPath}`} className="font-semibold" style={{ color: T.accent }}>
              Open this place in the app →
            </a>
          )}
          {step === 2 && (
            <a href={appUrl} className="font-semibold" style={{ color: T.accent }}>
              Try it on your own street →
            </a>
          )}
        </span>
      </div>
    </div>
  );
}
