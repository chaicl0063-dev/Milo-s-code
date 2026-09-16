"use client";

import { ASK, MIA, PLACE, STORY, STREET } from "@/lib/site-v2/content";
import { PERSONA } from "@/lib/personas";
import { useScriptedSpeech } from "@/components/site/useScriptedSpeech";
import { Icon, Label, PlayButton, Waveform, btnIcon, btnInner, container, h2Base, lead } from "@/components/site-v2/ui";
import { Reveal, useVisualActive, waveMode } from "@/components/site-v2/motion";

/**
 * 02 · SEE & HEAR（+ 追问）。样张几何（1024 宽）：左 5–30% 文字 + 「Try an example →」蓝色下划线链接；
 * 中 33–68% 地点卡：大缩略图 100px 在左，标题 20 粗，「类别 | 距离」，带边框的播放条（播放圆 + 波形 + 计数），下面一段正文；
 * 右 70–97% 对话卡：头像 + 「Mia  AI Guide ●」，Mia 气泡（浅底）、你的追问（淡蓝底，靠右）、底部输入条。
 * 与样张不同处（内容真实性）：没有 About/Photos/People/In the past 标签（应用没有）→ 放四个核对过的事实小标签；
 * 没有 0:28（不伪装计时）→ 显示句数或播放进度；输入条是进入应用里该地点页的真实链接，不是假输入框。
 * 播放条是真实试听（与首屏共用 hook 的全站互斥），逐句读 Mia 的三句讲述。
 */
export function SeeHear({ appUrl }: { appUrl: string }) {
  const speech = useScriptedSpeech(appUrl);
  const [waveRef, visuallyActive] = useVisualActive<HTMLDivElement>();
  const follow = ASK[1];
  const placeUrl = `${appUrl.replace(/\/$/, "")}${PLACE.appPath}`;
  const { state } = speech;
  const mine = state.key === "see-hear";
  const playing = mine && state.status === "playing";
  const loading = mine && state.status === "loading";
  const paused = mine && state.status === "paused";
  const errored = mine && state.status === "error";
  const done = mine && state.status === "done";
  const idx = mine && state.index >= 0 ? Math.min(state.index, STORY.length - 1) : -1;
  const progress = done ? 1 : playing || paused ? (idx + 0.5) / STORY.length : 0;
  const label = playing ? "Pause" : paused ? "Resume" : loading ? "Preparing" : errored ? "Retry" : "Hear the story";
  const onClick = () => {
    if (playing) speech.pause();
    else if (paused) speech.resume();
    else void speech.play("see-hear", STORY, PERSONA.mia.gender);
  };

  return (
    <section id="see" className="py-7 lg:py-7">
      <div className={`${container} grid gap-6 lg:grid-cols-[25fr_35fr_27fr] lg:items-start lg:gap-[2.5%] [&>*]:min-w-0`}>
        <div className="lg:pt-2">
          <Label>02 / See &amp; hear</Label>
          <h2 className={`${h2Base} mt-3 text-[32px] md:text-[38px] lg:text-[36px]`}>
            A place is more
            <br />
            than just a name.
          </h2>
          <p className={`${lead} mt-4 max-w-[36ch]`}>Tap a place. Mia tells you what it is and what to look for, sentence by sentence. Ask a follow-up and she answers from the same sources.</p>
          <a href={placeUrl} className="mt-5 inline-flex items-center gap-2.5 text-[16px] font-semibold text-(--v2-blue) underline decoration-(--v2-blue) decoration-[1.5px] underline-offset-[6px] transition-colors duration-150 fine:hover:text-(--v2-accent) motion-reduce:transition-none">
            Try this place in the app <Icon.ArrowRight size={18} />
          </a>
        </div>

        {/* 地点卡 + 对话卡：一个显现组（M-D3） */}
        <Reveal>
        <div ref={waveRef} className="min-w-0 overflow-hidden rounded-[16px] border border-(--v2-line) bg-white p-4 shadow-(--v2-shadow-sm)">
          <div className="flex gap-4">
            <img src={STREET.hero.thumb} alt="" width={100} height={100} loading="lazy" decoding="async" className="h-[88px] w-[88px] shrink-0 rounded-[12px] object-cover lg:h-[100px] lg:w-[100px]" />
            <div className="min-w-0 flex-1">
              <p className="text-[20px] font-bold leading-tight tracking-[-0.01em] text-(--v2-ink) min-[400px]:truncate">{PLACE.name}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[13.5px] text-(--v2-muted)">
                <span>{PLACE.kind}</span>
                <span className="text-(--v2-line-blue)">|</span>
                <span>{PLACE.distance} away</span>
              </p>
              <div className={`mt-3 flex items-center gap-3 rounded-[14px] border px-3 py-2.5 ${mine && state.status !== "idle" ? "border-(--v2-outline) bg-(--v2-accent-soft)" : "border-(--v2-line) bg-white"}`}>
                <button type="button" onClick={onClick} disabled={loading} aria-label={label} title={label} className={btnIcon}>
                  <span className={`${btnInner} rounded-full`}>
                    <PlayButton playing={playing} size={40} label={label} />
                  </span>
                </button>
                <Waveform progress={progress} height={26} mode={waveMode(state.status, mine, visuallyActive)} className="min-w-0 flex-1 overflow-hidden max-[399px]:[mask-image:linear-gradient(to_right,#000_78%,transparent)]" />
                <span className="shrink-0 text-[13.5px] font-medium tabular-nums text-(--v2-muted)">{idx >= 0 ? `${idx + 1} / ${STORY.length}` : `${STORY.length} sent.`}</span>
              </div>
            </div>
          </div>
          <ul className="mt-3.5 flex flex-wrap gap-1.5">
            {PLACE.facts.map((f) => (
              <li key={f} className="rounded-[8px] bg-(--v2-accent-soft) px-2.5 py-1 text-[13px] font-medium text-(--v2-ink2)">
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11.5px] text-(--v2-faint)">Sources · {PLACE.sources.join(" · ")}</p>
        </div>

        {/* Mia 对话 */}
        <div className="flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-(--v2-line) bg-white p-4 shadow-(--v2-shadow-sm)">
          <div className="flex items-center gap-3">
            <img src={MIA.image} alt={MIA.name} width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
            <p className="flex items-center gap-2.5 text-[15px]">
              <span className="font-bold text-(--v2-ink)">{MIA.name}</span>
              <span className="text-(--v2-muted)">AI guide</span>
              <span className="h-2 w-2 rounded-full bg-[#22B35A]" aria-hidden />
            </p>
            <span className="ml-auto rounded-full border border-(--v2-line) px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-(--v2-label)">Sample</span>
          </div>
          <ol className="mt-2.5 flex flex-col gap-2 [overflow-wrap:anywhere]">
            <li className="ml-[50px] rounded-[14px] rounded-tl-[4px] bg-(--v2-surface2) px-3.5 py-2.5 text-[14px] leading-[1.5] text-(--v2-ink2)">{STORY[0]}</li>
            <li className="flex justify-end">
              <div className="max-w-[86%] rounded-[14px] rounded-tr-[4px] bg-[#E2F3FD] px-3.5 py-2.5 text-[14px] leading-[1.5] text-(--v2-ink2)">{follow.q}</div>
            </li>
            <li className="ml-[50px] rounded-[14px] rounded-tl-[4px] bg-(--v2-surface2) px-3.5 py-2.5 text-[14px] leading-[1.5] text-(--v2-ink2)">{follow.a}</li>
          </ol>
          <p className="mt-1.5 text-right text-[11px] text-(--v2-faint)">AI-generated · from the same sources</p>
          <a href={placeUrl} className="group/btn mt-2.5 flex h-11 touch-manipulation items-center rounded-full border border-(--v2-line) bg-(--v2-surface2) pl-5 pr-2 text-[14.5px] text-(--v2-muted) transition-[color,border-color] duration-150 fine:hover:border-(--v2-outline) motion-reduce:transition-none">
            <span className={`${btnInner} w-full justify-between gap-2`}>
              Ask your own question in the app
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-(--v2-accent) text-white" aria-hidden>
                <Icon.Send size={16} />
              </span>
            </span>
          </a>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
