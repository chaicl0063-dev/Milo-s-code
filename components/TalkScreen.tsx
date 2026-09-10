"use client";

import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import { placeHref } from "@/lib/links";
import { BackButton } from "@/components/BackButton";
import { GuidePanel, TALK_INPUT_HEIGHT } from "@/components/GuidePanel";
import { PinIcon } from "@/components/Icons";

interface Props {
  lang: Lang;
  placeId: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  asrEnabled: boolean;
}

/**
 * 和导游聊某个地点的独立页面：顶部是返回 + 地点名（点名字回详情），
 * 中间是对话（进来就开讲），提问栏固定在底部。详情页因此只留信息，不混 AI 互动。
 */
export function TalkScreen({ lang, placeId, title, subtitle, thumbnail, asrEnabled }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-4 pt-4" style={{ paddingBottom: `calc(${TALK_INPUT_HEIGHT + 16}px + env(safe-area-inset-bottom))` }}>
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 bg-bg/95 px-4 py-3 backdrop-blur">
        <BackButton label={t(lang, "back")} />
        <Link href={placeHref(lang, placeId)} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-accent-soft/40 text-accent">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <PinIcon size={20} />
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[16px] font-bold leading-5 text-ink">{title}</span>
            {subtitle && <span className="truncate text-[12px] text-muted">{subtitle}</span>}
          </span>
        </Link>
      </div>

      <GuidePanel placeId={placeId} uiLang={lang} asrEnabled={asrEnabled} autoStart layout="page" />
    </main>
  );
}
