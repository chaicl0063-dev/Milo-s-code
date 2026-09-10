"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { ChevronRightIcon } from "@/components/Icons";
import { SourceLinks } from "@/components/SourceLinks";
import type { PlaceDetail } from "@/lib/places/types";

export interface Fact {
  label: string;
  value: string;
  href?: string;
}

/** 地址、开放时间、电话、网站、数据来源链接：默认折叠成「更多信息 ›」，展开后是和坐标同号的小字 */
export function DetailFacts({ facts, lang, links }: { facts: Fact[]; lang: Lang; links?: PlaceDetail["links"] }) {
  const [open, setOpen] = useState(false);
  const hasLinks = Boolean(links && Object.values(links).some(Boolean));
  if (facts.length === 0 && !hasLinks) return null;
  return (
    <div className="flex flex-col gap-1 text-[13px] leading-5 text-muted">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center gap-1 self-start text-accent">
        <span>{t(lang, open ? "lessInfo" : "moreInfo")}</span>
        <ChevronRightIcon size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open &&
        facts.map((f) => (
          <p key={f.label} className="flex gap-2">
            <span className="shrink-0 text-faint">{f.label}</span>
            {f.href ? (
              <a href={f.href} className="min-w-0 truncate text-accent" target={f.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                {f.value}
              </a>
            ) : (
              <span className="min-w-0">{f.value}</span>
            )}
          </p>
        ))}
      {open && hasLinks && links && (
        <div className="flex items-center gap-2 pt-1">
          <span className="shrink-0 text-faint">{t(lang, "sourcesLabel")}</span>
          <SourceLinks links={links} lang={lang} size="sm" />
        </div>
      )}
    </div>
  );
}
