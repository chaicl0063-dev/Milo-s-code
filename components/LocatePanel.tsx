"use client";

import { useState } from "react";
import { CITIES, type City } from "@/lib/cities";
import { t, type Lang } from "@/lib/i18n";
import { parseCoords } from "@/lib/geo";
import { ChevronRightIcon, LocateIcon, LocationOffIcon } from "@/components/Icons";
import { LanguageToggle } from "@/components/LanguageToggle";

interface Props {
  lang: Lang;
  locating: boolean;
  canUseGeolocation: boolean;
  onAllowLocation: () => void;
  onPickCity: (city: City) => void;
  onCoords: (coords: { lat: number; lon: number }) => void;
}

/** 定位失败或用户想换地方时显示的整屏面板 */
export function LocatePanel({ lang, locating, canUseGeolocation, onAllowLocation, onPickCity, onCoords }: Props) {
  const [showCoords, setShowCoords] = useState(false);
  const [coordsText, setCoordsText] = useState("");
  const [coordsError, setCoordsError] = useState<string | null>(null);

  function submitCoords(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseCoords(coordsText);
    if (!parsed) {
      setCoordsError(t(lang, "coordsInvalid"));
      return;
    }
    setCoordsError(null);
    onCoords(parsed);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-7 px-6 pb-9 pt-14">
      <div className="flex items-start justify-between">
        <LocationOffIcon />
        <LanguageToggle />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-[36px] leading-10">{t(lang, "whereAreYou")}</h1>
        <p className="text-[15px] leading-6 text-muted">{t(lang, "couldNotLocate")}</p>
      </div>

      {canUseGeolocation && (
        <button
          type="button"
          onClick={onAllowLocation}
          disabled={locating}
          className="flex h-14 items-center justify-center gap-2.5 rounded-[18px] bg-ink text-[16px] font-bold text-bg disabled:opacity-60"
        >
          <LocateIcon size={20} />
          <span>{locating ? t(lang, "locating") : t(lang, "allowLocation")}</span>
        </button>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">{t(lang, "popularCities")}</h2>
        <ul className="flex flex-col rounded-[20px] bg-surface py-1">
          {CITIES.map((city, i) => (
            <li key={city.id}>
              {i > 0 && <div className="mx-4 h-px bg-[#EDE8DE]" />}
              <button
                type="button"
                onClick={() => onPickCity(city)}
                className="flex h-14 w-full items-center gap-3.5 px-4 text-left"
              >
                <div className="flex flex-1 flex-col">
                  <span className="text-[16px] font-semibold">{city.name[lang]}</span>
                  <span className="text-[13px] text-muted">{city.country[lang]}</span>
                </div>
                <ChevronRightIcon className="text-[#B0AA9E]" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex-1" />

      {showCoords ? (
        <form onSubmit={submitCoords} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={coordsText}
              onChange={(e) => setCoordsText(e.target.value)}
              placeholder={t(lang, "coordsPlaceholder")}
              inputMode="decimal"
              autoFocus
              className="h-12 flex-1 rounded-2xl border border-line bg-surface px-4 text-[15px] outline-none focus:border-ink"
            />
            <button type="submit" className="h-12 rounded-2xl bg-ink px-5 text-[15px] font-bold text-bg">
              {t(lang, "go")}
            </button>
          </div>
          {coordsError && <p className="text-[13px] text-accent">{coordsError}</p>}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowCoords(true)}
          className="text-center text-[14px] font-semibold text-accent"
        >
          {t(lang, "enterCoordinates")}
        </button>
      )}
    </div>
  );
}
