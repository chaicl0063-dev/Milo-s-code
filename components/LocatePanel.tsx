"use client";

import { useEffect, useState } from "react";
import { CITIES, type City } from "@/lib/cities";
import { t, type Lang } from "@/lib/i18n";
import { parseCoords } from "@/lib/geo";
import type { SearchResult } from "@/app/api/search/route";
import { BackIcon, ChevronRightIcon, LocateIcon, LocationOffIcon, PinIcon, SearchIcon } from "@/components/Icons";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Segmented } from "@/components/SubpageShell";

interface Props {
  lang: Lang;
  locating: boolean;
  canUseGeolocation: boolean;
  /** 从首页进来「换个地方」时传入，显示返回按钮；首次进入不传 */
  onClose?: () => void;
  /** 当前浏览中心，用来让搜索结果更贴近（也决定要不要查高德） */
  near?: { lat: number; lon: number } | null;
  onAllowLocation: () => void;
  onPickCity: (city: City) => void;
  onCoords: (coords: { lat: number; lon: number }) => void;
}

/** 选地面板：搜索地名或输入坐标、允许定位、热门城市 */
export function LocatePanel({ lang, locating, canUseGeolocation, onClose, near, onAllowLocation, onPickCity, onCoords }: Props) {
  const [mode, setMode] = useState<"name" | "coords">("name");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [coordsError, setCoordsError] = useState<string | null>(null);

  // 地名模式：停止输入 450 ms 后搜一次
  useEffect(() => {
    if (mode !== "name") return;
    const q = query.trim();
    if (q.length < 2) return; // 不够两个字不搜；渲染那边按 query 长度决定显不显示结果
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      const params = new URLSearchParams({ q, lang });
      if (near) {
        params.set("lat", String(near.lat));
        params.set("lon", String(near.lon));
      }
      fetch(`/api/search?${params}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((d: { results?: SearchResult[] }) => setResults(d.results ?? []))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, lang, mode, near]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "coords") {
      const parsed = parseCoords(query);
      if (!parsed) {
        setCoordsError(t(lang, "coordsInvalid"));
        return;
      }
      setCoordsError(null);
      onCoords(parsed);
    } else if (results && results[0]) {
      onCoords({ lat: results[0].lat, lon: results[0].lon });
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-6 px-6 pb-9 pt-14">
      <div className="flex items-start justify-between">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, "back")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink shadow-[0_4px_14px_rgba(27,31,29,0.10)]"
          >
            <BackIcon />
          </button>
        ) : (
          <LocationOffIcon />
        )}
        <LanguageToggle />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-[36px] leading-10">{t(lang, onClose ? "changePlace" : "whereAreYou")}</h1>
        {!onClose && <p className="text-[15px] leading-6 text-muted">{t(lang, "couldNotLocate")}</p>}
      </div>

      {/* 搜索：地名 / 坐标 */}
      <form onSubmit={submit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 focus-within:border-ink">
            <SearchIcon size={18} className="shrink-0 text-faint" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCoordsError(null);
              }}
              placeholder={mode === "name" ? t(lang, "searchPlace") : t(lang, "coordsPlaceholder")}
              inputMode={mode === "coords" ? "decimal" : "search"}
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </div>
          {mode === "coords" && (
            <button type="submit" className="h-12 shrink-0 rounded-2xl bg-ink px-4 text-[14px] font-bold text-bg">
              {t(lang, "go")}
            </button>
          )}
        </div>
        <Segmented
          options={[
            { value: "name", label: t(lang, "byName") },
            { value: "coords", label: t(lang, "byCoords") },
          ]}
          value={mode}
          onChange={(v) => {
            setMode(v as "name" | "coords");
            setResults(null);
            setCoordsError(null);
          }}
        />
        {coordsError && <p className="text-[13px] text-accent">{coordsError}</p>}
      </form>

      {mode === "name" && query.trim().length >= 2 && (searching || results) && (
        <ul className="flex flex-col rounded-[20px] bg-surface py-1">
          {searching && !results?.length && <li className="px-4 py-3 text-[14px] text-muted">{t(lang, "searching")}</li>}
          {!searching && results?.length === 0 && <li className="px-4 py-3 text-[14px] text-muted">{t(lang, "noResults")}</li>}
          {results?.map((r, i) => (
            <li key={`${r.lat},${r.lon},${i}`}>
              {i > 0 && <div className="mx-4 h-px bg-[#EDE8DE]" />}
              <button type="button" onClick={() => onCoords({ lat: r.lat, lon: r.lon })} className="flex h-14 w-full items-center gap-3 px-4 text-left">
                <PinIcon size={18} className={r.kind === "city" ? "text-faint" : "text-accent"} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-semibold">{r.name}</span>
                  {r.detail && <span className="truncate text-[12px] text-muted">{r.detail}</span>}
                </span>
                <ChevronRightIcon className="shrink-0 text-[#B0AA9E]" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {canUseGeolocation && (
        <button
          type="button"
          onClick={onAllowLocation}
          disabled={locating}
          className="flex h-14 items-center justify-center gap-2.5 rounded-[18px] bg-ink text-[16px] font-bold text-bg disabled:opacity-60"
        >
          <LocateIcon size={20} />
          <span>{locating ? t(lang, "locating") : t(lang, onClose ? "myLocation" : "allowLocation")}</span>
        </button>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">{t(lang, "popularCities")}</h2>
        <ul className="flex flex-col rounded-[20px] bg-surface py-1">
          {CITIES.map((city, i) => (
            <li key={city.id}>
              {i > 0 && <div className="mx-4 h-px bg-[#EDE8DE]" />}
              <button type="button" onClick={() => onPickCity(city)} className="flex h-14 w-full items-center gap-3.5 px-4 text-left">
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
    </div>
  );
}
