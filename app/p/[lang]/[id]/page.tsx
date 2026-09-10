import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlaceDetail } from "@/lib/places/detail";
import { categoryLabel, isLang, t } from "@/lib/i18n";
import { formatCoords } from "@/lib/geo";
import { homeHref } from "@/lib/links";
import { llmConfigured } from "@/lib/guide";
import { BackButton } from "@/components/BackButton";
import { GuidePanel } from "@/components/GuidePanel";
import { SourceLinks } from "@/components/SourceLinks";
import { FavoriteStar } from "@/components/FavoriteStar";
import { PinIcon } from "@/components/Icons";

type Params = Promise<{ lang: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang)) return {};
  const place = await getPlaceDetail(lang, decodeURIComponent(id)).catch(() => null);
  return place ? { title: `${place.title} · ReAround You`, description: place.description } : {};
}

export default async function PlacePage({ params }: { params: Params }) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();

  const place = await getPlaceDetail(lang, decodeURIComponent(id));

  if (!place) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col gap-4 px-6 pt-14">
        <BackButton label={t(lang, "back")} />
        <h1 className="mt-6 font-serif text-[34px] leading-10">{t(lang, "notFoundTitle")}</h1>
        <p className="text-[15px] leading-6 text-muted">{t(lang, "notFoundBody")}</p>
      </main>
    );
  }

  const image = place.image?.source;
  const mapHref = place.coordinates ? homeHref(place.coordinates.lat, place.coordinates.lon, place.id) : "/";
  const eyebrow = place.description || (place.category ? categoryLabel(lang, place.category) : "");
  const facts: Array<{ label: string; value: string; href?: string }> = [];
  if (place.address) facts.push({ label: t(lang, "address"), value: place.address });
  if (place.openingHours) facts.push({ label: t(lang, "openingHours"), value: place.openingHours });
  if (place.phone) facts.push({ label: t(lang, "phone"), value: place.phone, href: `tel:${place.phone}` });
  if (place.website) facts.push({ label: t(lang, "website"), value: place.website.replace(/^https?:\/\//, ""), href: place.website });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-surface">
      {/* 返回按钮：sticky 且高度为 0，滚到讲解那里也一直停在顶部 */}
      <div className="pointer-events-none sticky top-5 z-20 h-0 px-5">
        <BackButton label={t(lang, "back")} className="pointer-events-auto" />
      </div>
      {/* 头图 */}
      <div className="relative h-[380px] w-full overflow-hidden bg-[#d9c8b2]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={place.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-[#e7d6c4] to-[#c8b39a]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-b from-transparent to-surface" />
        {place.coordinates && (
          <div className="absolute right-5 top-5">
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
          </div>
        )}
      </div>

      {/* 正文；relative 让它压在头图的渐变层之上 */}
      <article className="relative -mt-16 flex flex-1 flex-col gap-5 px-6 pb-10">
        <div className="flex flex-col gap-2">
          {eyebrow && <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-accent">{eyebrow}</p>}
          <h1 className="font-serif text-[38px] leading-[42px]">{place.title}</h1>
          {place.coordinates && (
            <Link href={mapHref} className="flex items-center gap-2 text-[13px] text-muted">
              <PinIcon size={16} />
              <span>{formatCoords(place.coordinates.lat, place.coordinates.lon)}</span>
            </Link>
          )}
        </div>

        {llmConfigured() && <GuidePanel placeId={place.id} uiLang={lang} />}

        {place.extract ? (
          <p className="text-[15px] leading-6 text-ink-soft">{place.extract}</p>
        ) : (
          <p className="text-[14px] leading-6 text-faint">{t(lang, "noExtract")}</p>
        )}

        {facts.length > 0 && (
          <dl className="flex flex-col divide-y divide-line rounded-[18px] bg-surface-2/70 px-4">
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-faint">{f.label}</dt>
                <dd className="text-[14px] leading-5 text-ink-soft">
                  {f.href ? (
                    <a href={f.href} className="text-accent" target={f.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                      {f.value}
                    </a>
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}


        <SourceLinks links={place.links} lang={lang} />
      </article>
    </main>
  );
}
