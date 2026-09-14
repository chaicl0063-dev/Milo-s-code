"use client";

import { PERSONA, PERSONAS, type PersonaId } from "@/lib/personas";
import { DEMO_COMPARE, DEMO_PLACE } from "@/lib/site/demo";
import type { useScriptedSpeech } from "@/components/site/useScriptedSpeech";

type Speech = ReturnType<typeof useScriptedSpeech>;

const T = { ink: "#1F1D1A", accent: "#D9633A", deep: "#A84427", teal: "#2F5D62", muted: "#6B645A", line: "#E4D9C8", paper: "#F3ECDF" } as const;

/**
 * I02 · 同一地点、同一组事实，两位导游各讲一段，方便比较讲述风格。
 * 两段互斥播放；显示时长与播放状态；有停止与重播；选中态用文字和勾，不只靠颜色。
 * 「Start with X」把选择带进应用（?persona=），只在用户明确点击时才覆盖应用里的偏好。
 */
export function GuideCompare({ appUrl, speech }: { appUrl: string; speech: Speech }) {
  const { state } = speech;
  const base = appUrl.replace(/\/$/, "");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[14px]" style={{ color: T.muted }}>
        Same place, same facts, two ways of telling it. Tap to compare; one plays at a time.
        <span className="ml-1 font-semibold" style={{ color: T.ink }}>
          {DEMO_PLACE.name}, {DEMO_PLACE.area}.
        </span>
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {PERSONAS.map((id: PersonaId) => {
          const p = PERSONA[id];
          const script = DEMO_COMPARE[id];
          const mine = state.key === id;
          const playing = mine && state.status === "playing";
          const paused = mine && state.status === "paused";
          const loading = mine && state.status === "loading";
          const done = mine && state.status === "done";
          const errored = mine && state.status === "error";
          const color = id === "mia" ? T.accent : T.teal;
          return (
            <div key={id} className="flex flex-col gap-5 rounded-[20px] p-6 md:p-8" style={{ background: T.paper, outline: mine ? `2px solid ${color}` : "none" }} aria-current={mine ? "true" : undefined}>
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/${id}-300.jpg`} alt={`${p.name}, an AI guide character`} width={72} height={72} className="h-[72px] w-[72px] shrink-0 rounded-[16px] object-cover" style={{ background: color }} />
                <div className="min-w-0">
                  <h3 className="font-serif text-[34px] leading-none" style={{ color: T.ink }}>
                    {p.name}
                    {mine && <span className="ml-2 align-middle text-[12px] font-sans font-bold" style={{ color }}>✓ selected</span>}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-5" style={{ color: T.muted }}>
                    {script.styleNote}
                  </p>
                </div>
              </div>

              <p className="text-[15px] leading-7" style={{ color: "#2E2A25" }}>
                {script.sentences.map((s, i) => (
                  <span key={i} className={mine && (playing || paused) && i === state.index ? "rounded" : undefined} style={mine && (playing || paused) && i === state.index ? { background: "rgba(217,99,58,0.16)" } : undefined}>
                    {s}{" "}
                  </span>
                ))}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {!playing && !paused && (
                  <button
                    type="button"
                    onClick={() => void speech.play(id, script.sentences, p.gender)}
                    disabled={loading}
                    className="inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[14px] font-semibold disabled:opacity-60"
                    style={{ borderColor: T.line, color: T.ink, background: "#fff" }}
                  >
                    <span className="inline-block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent" style={{ borderLeftColor: color }} aria-hidden />
                    {loading ? "Preparing…" : done ? `Replay ${p.name}` : `Hear ${p.name}`}
                  </button>
                )}
                {playing && (
                  <button type="button" onClick={speech.pause} className="inline-flex h-11 items-center rounded-full border px-5 text-[14px] font-semibold" style={{ borderColor: T.line, color: T.ink, background: "#fff" }}>
                    Pause
                  </button>
                )}
                {paused && (
                  <button type="button" onClick={speech.resume} className="inline-flex h-11 items-center rounded-full border px-5 text-[14px] font-semibold" style={{ borderColor: T.line, color: T.ink, background: "#fff" }}>
                    Resume
                  </button>
                )}
                {(playing || paused || loading) && (
                  <button type="button" onClick={speech.stop} className="text-[13px] font-bold" style={{ color: T.deep }}>
                    {loading ? "Cancel" : "Stop"}
                  </button>
                )}
                <span className="text-[12px]" style={{ color: T.muted }} aria-live="polite">
                  {loading ? "Loading audio" : playing ? `Playing${state.durationSec ? ` · ${state.durationSec}s` : ""}` : paused ? "Paused" : done ? `Played · ${state.durationSec ?? ""}s` : errored ? (state.index > 0 ? "Audio stopped partway, the text is complete above" : "Audio unavailable right now, the text is above") : state.key && !mine ? "" : ""}
                </span>
              </div>

              <a href={`${base}/?persona=${id}`} className="inline-flex h-11 items-center justify-center self-start rounded-full px-5 text-[14px] font-bold text-white" style={{ background: T.ink }}>
                Start with {p.name}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
