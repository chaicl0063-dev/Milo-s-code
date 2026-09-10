"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { categoryLabel, isLang, t } from "@/lib/i18n";
import { formatCoords } from "@/lib/geo";
import { placeHref } from "@/lib/links";
import { getSaved, useOnline, type SavedPlace } from "@/lib/offline";
import { useLanguage } from "@/components/LanguageProvider";
import { BackButton } from "@/components/BackButton";
import { GuidePanel } from "@/components/GuidePanel";
import { SourceLinks } from "@/components/SourceLinks";
import { ExternalIcon, PinIcon } from "@/components/Icons";

/** 离线阅读页：所有内容来自本机 IndexedDB，没网也能开 */
export function SavedScreen() {
  const { lang: uiLang } = useLanguage();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const langParam = sp.get("lang");
  const lang = isLang(langParam) ? langParam : uiLang;
  const online = useOnline();

  const [state, setState] = useState<{ status: "loading" | "missing" | "ready"; saved?: SavedPlace }>({ status: "loading" });
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    getSaved(id, lang)
      .then((saved) => {
        if (!saved) {
          setState({ status: "missing" });
          return;
        }
        if (saved.image) {
          url = URL.createObjectURL(saved.image);
          setImageUrl(url);
        } else if (saved.place.image?.source) {
          setImageUrl(saved.place.image.source);
        }
        setState({ status: "ready", saved });
      })
      .catch(() => setState({ status: "missing" }));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, lang]);

  if (state.status === "loading") {
    return <div className="min-h-dvh bg-surface" />;
  }
  if (state.status === "missing" || !state.saved) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col gap-4 px-6 pt-14">
        <BackButton label={t(uiLang, "back")} />
        <p className="mt-6 text-[15px] leading-6 text-muted">{t(uiLang, "notSaved")}</p>
        {id && online && (
          <Link href={placeHref(lang, id)} className="text-[14px] font-semibold text-accent">
            {t(uiLang, "viewLatest")}
          </Link>
        )}
      </main>
    );
  }

  const { place, narration, guideLang, savedAt } = state.saved;
  const eyebrow = place.description || (place.category ? categoryLabel(lang, place.category) : "");
  const facts: Array<{ label: string; value: string }> = [];
  if (place.address) facts.push({ label: t(uiLang, "address"), value: place.address });
  if (place.openingHours) facts.push({ label: t(uiLang, "openingHours"), value: place.openingHours });
  if (place.phone) facts.push({ label: t(uiLang, "phone"), value: place.phone });
  if (place.website) facts.push({ label: t(uiLang, "website"), value: place.website.replace(/^https?:\/\//, "") });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-surface">
      <div className="pointer-events-none sticky top-5 z-20 h-0 px-5">
        <BackButton label={t(uiLang, "back")} className="pointer-events-auto" />
      </div>
      <div className="relative h-[380px] w-full overflow-hidden bg-[#d9c8b2]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={place.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-[#e7d6c4] to-[#c8b39a]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-b from-transparent to-surface" />
        <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-surface/95 px-3 py-1.5 text-[12px] font-bold text-ink shadow-[0_4px_14px_rgba(27,31,29,0.12)]">
          {t(uiLang, online ? "offlineCopy" : "offlineNow")}
        </div>
      </div>

      <article className="relative -mt-16 flex flex-1 flex-col gap-5 px-6 pb-10">
        <div className="flex flex-col gap-2">
          {eyebrow && <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-accent">{eyebrow}</p>}
          <h1 className="font-serif text-[38px] leading-[42px]">{place.title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            {place.coordinates && (
              <span className="flex items-center gap-2">
                <PinIcon size={16} />
                {formatCoords(place.coordinates.lat, place.coordinates.lon)}
              </span>
            )}
            <span>
              {t(uiLang, "savedOn")} {new Date(savedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <GuidePanel placeId={place.id} uiLang={uiLang} initialNarration={narration} initialGuideLang={guideLang} allowFollowUp={online} />

        {place.extract ? (
          <p className="text-[15px] leading-6 text-ink-soft">{place.extract}</p>
        ) : (
          <p className="text-[14px] leading-6 text-faint">{t(uiLang, "noExtract")}</p>
        )}

        {facts.length > 0 && (
          <dl className="flex flex-col divide-y divide-line rounded-[18px] bg-surface-2/70 px-4">
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-faint">{f.label}</dt>
                <dd className="text-[14px] leading-5 text-ink-soft">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {online && (
          <Link href={placeHref(lang, place.id)} className="flex items-center gap-2 text-[14px] font-semibold text-accent">
            <span>{t(uiLang, "viewLatest")}</span>
            <ExternalIcon />
          </Link>
        )}

        {online && <SourceLinks links={place.links} lang={uiLang} />}
      </article>
    </main>
  );
}
