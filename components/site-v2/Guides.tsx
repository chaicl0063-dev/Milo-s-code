"use client";

import { GUIDES } from "@/lib/site-v2/content";
import { DEMO_COMPARE } from "@/lib/site/demo";
import { DEFAULT_PERSONA, PERSONA, type PersonaId } from "@/lib/personas";
import { useScriptedSpeech } from "@/components/site/useScriptedSpeech";
import { Icon, Label, PlayButton, WaveBars, btnInner, container, h2Base, lead } from "@/components/site-v2/ui";
import { Reveal, useVisualActive, waveMode } from "@/components/site-v2/motion";

/**
 * 04 · CHOOSE YOUR GUIDE（F02 重排）。样张：左窄标题栏，右两张**横卡**——人物肖像占卡宽约三分之一、视觉高度大，
 * 右侧名字、三个淡蓝性格标签、一句短引用、「播放圆 + Hear Mia's voice + 波形图标」在一个紧凑区域里。
 * 肖像用纵向圆角框（不是把小圆放大挤压文字）。引用取 DEMO_COMPARE 里核对过的短句，试听播的就是这一句。
 * 第一张卡蓝色描边 = 应用的默认导游（DEFAULT_PERSONA）；「Start with X」保留为次要的真实入口（?persona=）。
 * 语种清单收成一句短信息。手机单列。
 */
const QUOTE_INDEX: Record<PersonaId, number> = { mia: 1, milo: 2 };

export function Guides({ appUrl }: { appUrl: string }) {
  const speech = useScriptedSpeech(appUrl);
  const base = appUrl.replace(/\/$/, "");
  const { state } = speech;
  const [cardsRef, visuallyActive] = useVisualActive<HTMLDivElement>();

  return (
    <section id="guides" className="py-8 lg:py-7">
      <div className={`${container} grid gap-6 lg:grid-cols-[31fr_63fr] lg:items-center lg:gap-[3%] [&>*]:min-w-0`}>
        <div>
          <Label>04 / Choose your guide</Label>
          <h2 className={`${h2Base} mt-3 text-[30px] md:text-[34px] lg:text-[26px]`}>A different perspective for every kind of explorer.</h2>
          <p className={`${lead} mt-3 text-[15px]`}>Same tower, same facts, two ways of telling it.</p>
          <p className="mt-1.5 text-[13px] text-(--v2-faint)">Both speak eight languages. Pick one when you open the app.</p>
        </div>

        {/* 两张卡：一个显现组（M-D4） */}
        <Reveal>
        <div ref={cardsRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-4 xl:grid-cols-2 xl:gap-[3%]">
          {GUIDES.map((g) => {
            const id = g.id as PersonaId;
            const persona = PERSONA[id];
            const line = DEMO_COMPARE[id].sentences[QUOTE_INDEX[id]];
            const mine = state.key === id;
            const playing = mine && state.status === "playing";
            const loading = mine && state.status === "loading";
            const paused = mine && state.status === "paused";
            const errored = mine && state.status === "error";
            const active = mine && (playing || loading || paused);
            const isDefault = id === DEFAULT_PERSONA;
            const label = playing ? "Pause" : paused ? "Resume" : loading ? "Preparing…" : errored ? "Retry" : `Hear ${g.name}'s voice`;
            const onClick = () => {
              if (playing) speech.pause();
              else if (paused) speech.resume();
              else void speech.play(id, [line], persona.gender);
            };

            return (
              <article key={g.id} className={`flex gap-4 rounded-[18px] border bg-white p-3.5 shadow-(--v2-shadow-sm) lg:gap-5 lg:p-4 ${active || isDefault ? "border-[1.5px] border-(--v2-outline)" : "border-(--v2-line)"}`}>
                {/* 纵向圆角肖像框，占卡宽约三分之一 */}
                <img src={g.image} alt={`${g.name}, ${persona.gender === "female" ? "female" : "male"} voice`} width={600} height={600} loading="lazy" decoding="async" className="h-[144px] w-[112px] shrink-0 rounded-[26px] object-cover object-top lg:h-[164px] lg:w-[132px] lg:rounded-[30px]" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-bold leading-none tracking-[-0.01em] text-(--v2-ink)">{g.name}</h3>
                    {isDefault && <span className="rounded-full bg-(--v2-accent-soft) px-2 py-0.5 text-[10.5px] font-semibold text-(--v2-blue)">Default</span>}
                    <a href={`${base}/?persona=${id}`} className="ml-auto inline-flex items-center gap-0.5 whitespace-nowrap text-[12px] font-medium text-(--v2-faint) transition-colors duration-150 fine:hover:text-(--v2-ink) motion-reduce:transition-none">
                      Start with {g.name} <Icon.Chevron size={13} />
                    </a>
                  </div>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {g.traits.map((t) => (
                      <li key={t} className="rounded-[8px] bg-(--v2-accent-soft) px-2.5 py-1 text-[12.5px] font-medium text-(--v2-ink2)">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-3 text-[15px] leading-[1.45] text-(--v2-ink2) ${playing || paused ? "rounded-[4px] bg-(--v2-accent-soft) box-decoration-clone px-1" : ""}`}>&ldquo;{line}&rdquo;</p>
                  <div className="mt-auto flex items-center gap-3 pt-3.5">
                    <button type="button" onClick={onClick} disabled={loading} aria-live={mine ? "polite" : undefined} className="group/btn inline-flex touch-manipulation items-center whitespace-nowrap text-[14.5px] font-semibold text-(--v2-blue) disabled:opacity-60">
                      <span className={btnInner}>
                        <PlayButton playing={playing} size={38} label={label} /> {label}
                      </span>
                    </button>
                    <WaveBars mode={waveMode(state.status, mine, visuallyActive)} className="ml-auto text-(--v2-accent)" />
                  </div>
                  {errored && <p className="mt-2 text-[12px] text-(--v2-muted)">Couldn&rsquo;t load the voice. Try again, or just read the line.</p>}
                </div>
              </article>
            );
          })}
        </div>
        </Reveal>
      </div>
    </section>
  );
}
