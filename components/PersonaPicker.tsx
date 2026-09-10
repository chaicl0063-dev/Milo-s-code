"use client";

import { PERSONA, PERSONAS, type PersonaId } from "@/lib/personas";
import type { Lang } from "@/lib/i18n";
import { CheckIcon } from "@/components/Icons";

/** 导游头像：名字首字母 + 人物专属底色 */
export function PersonaAvatar({ id, size = 28, className = "" }: { id: PersonaId; size?: number; className?: string }) {
  const p = PERSONA[id];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-serif font-bold text-bg ${className}`}
      style={{ width: size, height: size, background: p.color, fontSize: Math.round(size * 0.5) }}
    >
      {p.name[0]}
    </span>
  );
}

/** 选导游：两张并排卡片（Mia / Milo），引导页和设置页共用 */
export function PersonaPicker({ value, onChange, lang }: { value: PersonaId; onChange: (v: PersonaId) => void; lang: Lang }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PERSONAS.map((id) => {
        const p = PERSONA[id];
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`relative flex flex-col items-start gap-3 rounded-[18px] p-4 text-left transition-colors ${
              active ? "bg-ink text-bg" : "border border-line bg-surface text-ink hover:bg-surface-2"
            }`}
          >
            <PersonaAvatar id={id} size={44} />
            <span className="flex flex-col gap-1">
              <span className="text-[16px] font-bold">{p.name}</span>
              <span className={`text-[12px] leading-4 ${active ? "text-bg/75" : "text-muted"}`}>{p.tagline[lang]}</span>
            </span>
            {active && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-bg text-ink">
                <CheckIcon size={12} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
