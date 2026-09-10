"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { ChevronRightIcon } from "@/components/Icons";

export interface Fact {
  label: string;
  value: string;
  href?: string;
}

/** 地址、开放时间、电话、网站：默认折叠成「更多信息 ›」，展开后是和坐标同号的小字 */
export function DetailFacts({ facts, lang }: { facts: Fact[]; lang: Lang }) {
  const [open, setOpen] = useState(false);
  if (facts.length === 0) return null;
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
    </div>
  );
}
