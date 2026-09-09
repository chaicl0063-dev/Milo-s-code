import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { placeSummary } from "@/lib/wikipedia";
import { isLang, t } from "@/lib/i18n";
import { formatCoords } from "@/lib/geo";
import { homeHref } from "@/lib/links";
import { BackButton } from "@/components/BackButton";
import { ExternalIcon, PinIcon } from "@/components/Icons";

type Params = Promise<{ lang: string; title: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, title } = await params;
  if (!isLang(lang)) return {};
  const place = await placeSummary(lang, decodeURIComponent(title)).catch(() => null);
  return place ? { title: `${place.title} · Around You`, description: place.description } : {};
}

export default async function PlacePage({ params }: { params: Params }) {
  const { lang, title } = await params;
  if (!isLang(lang)) notFound();

  const place = await placeSummary(lang, decodeURIComponent(title));

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

      {/* 正文 */}
      {/* relative 让正文压在头图的渐变层之上，否则标题会被盖住 */}
      <article className="relative -mt-16 flex flex-1 flex-col gap-5 px-6 pb-10">
        <div className="flex flex-col gap-2">
          {place.description && (
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-accent">{place.description}</p>
          )}
          <h1 className="font-serif text-[38px] leading-[42px]">{place.title}</h1>
          {place.coordinates && (
            <Link href={backHref} className="flex items-center gap-2 text-[13px] text-muted">
              <PinIcon size={16} />
              <span>{formatCoords(place.coordinates.lat, place.coordinates.lon)}</span>
            </Link>
          )}
        </div>

        <p className="text-[15px] leading-6 text-ink-soft">{place.extract}</p>

        <a
          href={place.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[14px] font-semibold text-accent"
        >
          <span>{t(lang, "readOnWikipedia")}</span>
          <ExternalIcon />
        </a>
      </article>
    </main>
  );
}
