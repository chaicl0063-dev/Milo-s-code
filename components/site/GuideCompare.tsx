"use client";

import { PERSONA, PERSONAS, type PersonaId } from "@/lib/personas";
import { DEMO_COMPARE, DEMO_PLACE } from "@/lib/site/demo";
import type { useScriptedSpeech } from "@/components/site/useScriptedSpeech";
import { T } from "@/lib/site/theme";

type Speech = ReturnType<typeof useScriptedSpeech>;

/**
 * I02 · 同一地点、同一组事实，两位导游各讲一段，方便比较讲述风格。
 * 两段互斥播放；显示时长与播放状态；有停止与重播；选中态用文字和勾，不只靠颜色。
 * 「Start with X」把选择带进应用（?persona=），只在用户明确点击时才覆盖应用里的偏好。
 * 2026-09-15 按实施规格 §3 S06：声音选择面板的排版（姓名、风格、播放键、状态是重心，72px 肖像做识别），
 * 两位交互统一用 accent；当前试听对象标「Preview selected」，不声称已替用户更换应用偏好。
 */
export function GuideCompare({ appUrl, speech }: { appUrl: string; speech: Speech }) {
  const { state } = speech;
  const base = appUrl.replace(/\/$/, "");
  const btn = "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[14px] font-semibold transition-colors disabled:opacity-60";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[16px] leading-relaxed" style={{ color: T.muted }}>
        Same place, same facts, two ways of telling it. Tap to compare; one plays at a time.{" "}
        <span className="font-semibold" style={{ color: T.ink }}>
          {DEMO_PLACE.name}, {DEMO_PLACE.area}.
        </span>
      </p>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {PERSONAS.map((id: PersonaId) => {
          const p = PERSONA[id];
          const script = DEMO_COMPARE[id];
          const mine = state.key === id;
          const playing = mine && state.status === "playing";
          const paused = mine && state.status === "paused";
          const loading = mine && state.status === "loading";
          const done = mine && state.status === "done";
          const errored = mine && state.status === "error";
          return (
            <div
              key={id}
              className="flex flex-col gap-5 rounded-[20px] p-5 md:p-6"
              style={{ background: mine ? T.accentSoft : T.white, border: `${mine ? 2 : 1}px solid ${mine ? T.accent : T.line}`, boxShadow: T.shadow }}
              aria-current={mine ? "true" : undefined}
            >
              {/* 横向：肖像 · 姓名 + 风格 */}
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/${id}-300.jpg`} alt={`${p.name}, an AI guide character`} width={72} height={72} loading="lazy" className="h-[72px] w-[72px] shrink-0 rounded-[16px] object-cover" style={{ background: T.paper }} />
                <div className="min-w-0">
                  <h3 className="text-[24px] font-semibold leading-none tracking-[-0.02em]" style={{ color: T.ink }}>
                    {p.name}
                    {mine && (
                      <span className="ml-2 align-middle text-[12px] font-semibold tracking-[0.06em]" style={{ color: T.accent }}>
                        ✓ Preview selected
                      </span>
                    )}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-5" style={{ color: T.muted }}>
                    {script.styleNote}
                  </p>
                </div>
              </div>

              {/* 音频动作 + 状态 */}
              <div className="flex flex-wrap items-center gap-3">
                {!playing && !paused && (
                  <button type="button" onClick={() => void speech.play(id, script.sentences, p.gender)} disabled={loading} className={btn} style={{ borderColor: T.accent, color: "#fff", background: T.accent }}>
                    <span className="inline-block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white" aria-hidden />
                    {loading ? "Preparing…" : done ? `Replay ${p.name}` : `Hear ${p.name}`}
                  </button>
                )}
                {playing && (
                  <button type="button" onClick={speech.pause} className={btn} style={{ borderColor: T.line, color: T.ink, background: T.white }}>
                    Pause
                  </button>
                )}
                {paused && (
                  <button type="button" onClick={speech.resume} className={btn} style={{ borderColor: T.line, color: T.ink, background: T.white }}>
                    Resume
                  </button>
                )}
                {(playing || paused || loading) && (
                  <button type="button" onClick={speech.stop} className="text-[13px] font-semibold" style={{ color: T.accent }}>
                    {loading ? "Cancel" : "Stop"}
                  </button>
                )}
                <span className="text-[13px]" style={{ color: T.muted }} aria-live="polite">
                  {loading
                    ? "Loading audio"
                    : playing
                      ? `Playing${state.durationSec ? ` · ${state.durationSec}s` : ""}`
                      : paused
                        ? "Paused"
                        : done
                          ? `Played${state.durationSec ? ` · ${state.durationSec}s` : ""}`
                          : errored
                            ? state.index > 0
                              ? "Audio stopped partway, the text is complete below"
                              : "Audio unavailable right now, the text is below"
                            : ""}
                </span>
              </div>

              {/* 试听文本 */}
              <p className="text-[15px] leading-7 md:text-[16px]" style={{ color: T.ink }}>
                {script.sentences.map((s, i) => (
                  <span key={i} className={mine && (playing || paused) && i === state.index ? "rounded" : undefined} style={mine && (playing || paused) && i === state.index ? { background: mine ? "#fff" : T.accentSoft } : undefined}>
                    {s}{" "}
                  </span>
                ))}
              </p>

              <a href={`${base}/?persona=${id}`} className="inline-flex h-11 items-center justify-center self-start rounded-full border px-5 text-[14px] font-semibold" style={{ borderColor: T.line, color: T.ink, background: T.white }}>
                Start with {p.name}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
