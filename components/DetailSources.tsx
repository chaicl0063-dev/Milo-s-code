"use client";

import { useState } from "react";
import type { PlaceDetail } from "@/lib/places/types";
import { t, type Lang } from "@/lib/i18n";
import { ChevronRightIcon, ExternalIcon, SparkIcon } from "@/components/Icons";

/**
 * 「更多来源」：Wikivoyage 旅行指南（可展开）、UNESCO 世界遗产（链接）、
 * 旅行者论坛观点（TripAdvisor 等没有开放接口，做成由 AI 检索的付费预览入口，暂不可用）。
 */
export function DetailSources({ place, lang }: { place: PlaceDetail; lang: Lang }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const guide = place.travelGuide;
  const heritage = place.unesco;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">{t(lang, "moreSources")}</h2>
      <ul className="flex flex-col divide-y divide-line rounded-[18px] bg-surface-2/60">
        {heritage && (
          <li className="px-4 py-3">
            <a href={heritage.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-bg">UN</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[14px] font-semibold text-ink">{t(lang, "worldHeritage")}</span>
                <span className="truncate text-[12px] text-muted">{heritage.name}</span>
              </span>
              <ExternalIcon size={16} className="shrink-0 text-faint" />
            </a>
          </li>
        )}

        {guide && (
          <li className="px-4 py-3">
            <button type="button" onClick={() => setGuideOpen((v) => !v)} aria-expanded={guideOpen} className="flex w-full items-center gap-3 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">WV</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[14px] font-semibold text-ink">{t(lang, "travelGuide")} · Wikivoyage</span>
                <span className="truncate text-[12px] text-muted">{guide.title}</span>
              </span>
              <ChevronRightIcon size={16} className={`shrink-0 text-faint transition-transform ${guideOpen ? "rotate-90" : ""}`} />
            </button>
            {guideOpen && (
              <div className="mt-2 flex flex-col gap-2 pl-11">
                <p className="text-[14px] leading-6 text-ink-soft">{guide.extract}</p>
                <a href={guide.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] font-semibold text-accent">
                  {t(lang, "readMore")}
                  <ExternalIcon size={14} />
                </a>
              </div>
            )}
          </li>
        )}

        <li className="flex items-center gap-3 px-4 py-3 opacity-70">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
            <SparkIcon size={16} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[14px] font-semibold text-ink">{t(lang, "travelerForum")}</span>
            <span className="text-[12px] leading-4 text-muted">{t(lang, "travelerForumHint")}</span>
          </span>
          <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-faint">{t(lang, "comingSoonPaid")}</span>
        </li>
      </ul>
    </section>
  );
}
