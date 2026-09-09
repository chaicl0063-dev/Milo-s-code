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
import { ExternalIcon, PinIcon } from "@/components/Icons";

type Params = Promise<{ lang: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang)) return {};
  const place = await getPlaceDetail(lang, decodeURIComponent(id)).catch(() => null);
  return place ? { title: `${place.title} · Around You`, description: place.description } : {};
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
  const backHref = place.coordinates ? homeHref(place.coordinates.lat, place.coordinates.lon) : "/";
  const eyebrow = place.description || (place.category ? categoryLabel(lang, place.category) : "");
  const facts: Array<{ label: string; value: string; href?: string }> = [];
  if (place.address) facts.push({ label: t(lang, "address"), value: place.address });
  if (place.openingHours) facts.push({ label: t(lang, "openingHours"), value: place.openingHours });
  if (place.phone) facts.push({ label: t(lang, "phone"), value: place.phone, href: `tel:${place.phone}` });
  if (place.website) facts.push({ label: t(lang, "website"), value: place.website.replace(/^https?:\/\//, ""), href: place.website });

  const links: Array<{ label: string; href: string }> = [];
  if (place.links.wikipedia) links.push({ label: t(lang, "readOnWikipedia"), href: place.links.wikipedia });
  if (place.links.osm) links.push({ label: t(lang, "viewOnOsm"), href: place.links.osm });
  if (place.links.amap) links.push({ label: t(lang, "viewOnAmap"), href: place.links.amap });
  if (place.links.wikidata) links.push({ label: t(lang, "viewOnWikidata"), href: place.links.wikidata });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-surface">
      {/* 头图 */}
      <div className="relative h-[380px] w-full overflow-hidden bg-[#d9c8b2]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={place.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-[#e7d6c4] to-[#c8b39a]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-b from-transparent to-surface" />
        <div className="absolute left-5 top-5">
          <BackButton label={t(lang, "back")} />
        </div>
      </div>

      {/* 正文；relative 让它压在头图的渐变层之上 */}
      <article className="relative -mt-16 flex flex-1 flex-col gap-5 px-6 pb-10">
        <div className="flex flex-col gap-2">
          {eyebrow && <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-accent">{eyebrow}</p>}
          <h1 className="font-serif text-[38px] leading-[42px]">{place.title}</h1>
          {place.coordinates && (
            <Link href={backHref} className="flex items-center gap-2 text-[13px] text-muted">
              <PinIcon size={16} />
              <span>{formatCoords(place.coordinates.lat, place.coordinates.lon)}</span>
            </Link>
          )}
        </div>

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

        {llmConfigured() && <GuidePanel placeId={place.id} lang={lang} />}

        {links.length > 0 && (
          <ul className="flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[14px] font-semibold text-accent">
                  <span>{l.label}</span>
                  <ExternalIcon />
                </a>
              </li>
            ))}
          </ul>
        )}
      </article>
    </main>
  );
}
