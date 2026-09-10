import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPlaceDetail } from "@/lib/places/detail";
import { categoryLabel, isLang, t } from "@/lib/i18n";
import { formatCoords } from "@/lib/geo";
import { homeHref, talkHref } from "@/lib/links";
import { llmConfigured } from "@/lib/guide";
import { BackButton } from "@/components/BackButton";
import { SourceLinks } from "@/components/SourceLinks";
import { FavoriteStar } from "@/components/FavoriteStar";
import { ShareButton } from "@/components/ShareButton";
import { DetailFacts, type Fact } from "@/components/DetailFacts";
import { DetailSources } from "@/components/DetailSources";
import { PinIcon, SparkIcon } from "@/components/Icons";

type Params = Promise<{ lang: string; id: string }>;
type Search = Promise<{ guide?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang)) return {};
  const place = await getPlaceDetail(lang, decodeURIComponent(id)).catch(() => null);
  return place ? { title: `${place.title} · ReAround You`, description: place.description } : {};
}

export default async function PlacePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { lang, id } = await params;
  const { guide } = await searchParams;
  if (!isLang(lang)) notFound();
  // 旧链接 ?guide=1 直接进对话页
  if (guide === "1") redirect(talkHref(lang, decodeURIComponent(id)));

  const place = await getPlaceDetail(lang, decodeURIComponent(id));

  if (!place) {
    return (
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-6 pt-14">
        <BackButton label={t(lang, "back")} />
        <h1 className="mt-6 font-serif text-[34px] leading-10">{t(lang, "notFoundTitle")}</h1>
        <p className="text-[15px] leading-6 text-muted">{t(lang, "notFoundBody")}</p>
      </main>
    );
  }

  const image = place.image?.source;
  const mapHref = place.coordinates ? homeHref(place.coordinates.lat, place.coordinates.lon, place.id) : "/";
  const eyebrow = place.description || (place.category ? categoryLabel(lang, place.category) : "");
  const facts: Fact[] = [];
  if (place.address) facts.push({ label: t(lang, "address"), value: place.address });
  if (place.openingHours) facts.push({ label: t(lang, "openingHours"), value: place.openingHours });
  if (place.phone) facts.push({ label: t(lang, "phone"), value: place.phone, href: `tel:${place.phone}` });
  if (place.website) facts.push({ label: t(lang, "website"), value: place.website.replace(/^https?:\/\//, ""), href: place.website });
  // 介绍：Wikivoyage 里专门写这个地点的那段（旅行者写给旅行者）优先；百科摘要退到「更多信息」里
  const listing = place.travelGuide?.listing;
  const intro = listing?.content || place.extract;
  if (listing && place.extract) facts.push({ label: t(lang, "wikiSummary"), value: place.extract });

  return (
    <main className="mx-auto flex w-full max-w-[520px] flex-col bg-surface">
      {/* 顶部三个图标：返回 · 收藏 · 分享。sticky 且高度为 0，滚到讲解那里也一直停在顶部 */}
      <div className="pointer-events-none sticky top-5 z-20 flex h-0 items-start justify-between px-5">
        <BackButton label={t(lang, "back")} className="pointer-events-auto" />
        <div className="pointer-events-auto flex items-center gap-2">
          {place.coordinates && (
            <FavoriteStar
              uiLang={lang}
              size={22}
              className="bg-surface/95 shadow-[0_4px_14px_rgba(27,31,29,0.12)]"
              place={{
                id: place.id,
                lang,
                title: place.title,
                description: place.description || undefined,
                thumbnail: place.image?.source,
                lat: place.coordinates.lat,
                lon: place.coordinates.lon,
                category: place.category,
              }}
            />
          )}
          <ShareButton title={place.title} lang={lang} />
        </div>
      </div>

      {/* 头图 */}
      <div className="relative h-[340px] w-full overflow-hidden bg-[#d9c8b2]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={place.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-[#e7d6c4] to-[#c8b39a]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-b from-transparent to-surface" />
      </div>

      {/* 正文；relative 让它压在头图的渐变层之上 */}
      <article className="relative -mt-16 flex flex-1 flex-col gap-5 px-6 pb-4">
        <div className="flex flex-col gap-2">
          {eyebrow && <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-accent">{eyebrow}</p>}
          <h1 className="font-serif text-[38px] leading-[42px]">{place.title}</h1>
          <div className="flex flex-col gap-1 text-[13px] leading-5 text-muted">
            {place.coordinates && (
              <Link href={mapHref} className="flex items-center gap-2">
                <PinIcon size={16} />
                <span>{formatCoords(place.coordinates.lat, place.coordinates.lon)}</span>
              </Link>
            )}
            <DetailFacts facts={facts} lang={lang} />
          </div>
          {intro && <p className="pt-1 text-[14px] leading-6 text-ink-soft">{intro}</p>}
          {listing && place.travelGuide && (
            <a href={place.travelGuide.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-faint">
              {t(lang, "fromWikivoyage")}
            </a>
          )}
        </div>

        {/* AI 互动放在独立页面，详情页只留一个入口，保持干净 */}
        {llmConfigured() && (
          <Link href={talkHref(lang, place.id)} className="flex h-14 items-center justify-center gap-2.5 rounded-[18px] bg-ink text-[16px] font-bold text-bg">
            <SparkIcon size={20} />
            <span>{t(lang, "askGuide")}</span>
          </Link>
        )}

        <DetailSources place={place} lang={lang} />

        <SourceLinks links={place.links} lang={lang} />
      </article>
    </main>
  );
}
