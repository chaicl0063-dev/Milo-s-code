"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/places/types";
import { t } from "@/lib/i18n";
import { formatCoords, formatDistance, isValidCoords } from "@/lib/geo";
import { homeHref } from "@/lib/links";
import type { City } from "@/lib/cities";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LocatePanel } from "@/components/LocatePanel";
import { InstallHint } from "@/components/InstallHint";
import { PlaceList } from "@/components/PlaceList";
import { LocateIcon, PinIcon } from "@/components/Icons";

// Leaflet 依赖 window，只能在浏览器端渲染，所以关闭服务端渲染
const PlacesMap = dynamic(() => import("@/components/PlacesMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#ece6da]" />,
});

type Coords = { lat: number; lon: number };
const COORDS_KEY = "tourguide.coords";
const RADIUS_OPTIONS = [500, 1000, 2000, 5000];

export function HomeScreen() {
  const { lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 上带了坐标就直接用（分享链接、从详情页返回都是这种情况）
  const [coords, setCoords] = useState<Coords | null>(() => {
    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));
    return searchParams.has("lat") && isValidCoords(lat, lon) ? { lat, lon } : null;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const bootedRef = useRef(false); // 首次进入的初始化只跑一次

  const [radius, setRadius] = useState(1000);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // 点「重试」时 +1，触发重新请求

  // 一次请求的结果。key 记录这批结果对应的「坐标+语言+范围」，
  // 和当前 requestKey 不一致就说明还在加载，不需要单独的 loading 状态。
  const [result, setResult] = useState<{ key: string; places: Place[]; error: string | null }>({
    key: "",
    places: [],
    error: null,
  });
  const requestKey = coords ? `${coords.lat},${coords.lon},${lang},${radius},${reloadKey}` : null;
  const loading = requestKey !== null && result.key !== requestKey;
  const places = result.places;
  const error = result.key === requestKey ? result.error : null;

  const canUseGeolocation = typeof navigator !== "undefined" && "geolocation" in navigator;

  /** 采用一组新坐标：更新状态、URL 和本地缓存 */
  const applyCoords = useCallback(
    (next: Coords) => {
      setCoords(next);
      setShowPicker(false);
      router.replace(homeHref(next.lat, next.lon));
      try {
        window.localStorage.setItem(COORDS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [router],
  );

  /** 向浏览器要一次定位 */
  const requestLocation = useCallback(() => {
    if (!canUseGeolocation) {
      setShowPicker(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        applyCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setShowPicker(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  }, [applyCoords, canUseGeolocation]);

  // 首次进入且 URL 没带坐标：上次用过的坐标 > 请求定位。
  // localStorage 只能在浏览器里读，所以放在 effect 里；这里的 setState 是刻意的。
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    if (coords) return;
    try {
      const saved = window.localStorage.getItem(COORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Coords;
        if (isValidCoords(parsed.lat, parsed.lon)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCoords(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    requestLocation();
  }, [coords, requestLocation]);

  // 坐标、语言或范围变化时重新拉周边地点；组件卸载或条件再变时取消上一次请求
  useEffect(() => {
    if (!coords || !requestKey) return;
    const controller = new AbortController();
    fetch(`/api/nearby?lat=${coords.lat}&lon=${coords.lon}&lang=${lang}&radius=${radius}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { places: Place[] };
        setResult({ key: requestKey, places: data.places, error: null });
        setSelectedId(data.places[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult({ key: requestKey, places: [], error: t(lang, "loadError") });
      });
    return () => controller.abort();
  }, [coords, lang, radius, requestKey]);

  function pickCity(city: City) {
    applyCoords({ lat: city.lat, lon: city.lon });
  }

  // 还没有坐标，或用户主动要换地方：显示选城市面板
  if (!coords || showPicker) {
    if (!coords && !showPicker && !locating) {
      return null; // 首次渲染，还没决定要定位还是显示选城市面板
    }
    if (!coords && locating && !showPicker) {
      return (
        <div className="flex min-h-dvh items-center justify-center text-[15px] text-muted">{t(lang, "locating")}</div>
      );
    }
    return (
      <LocatePanel
        lang={lang}
        locating={locating}
        canUseGeolocation={canUseGeolocation}
        onAllowLocation={requestLocation}
        onPickCity={pickCity}
        onCoords={applyCoords}
      />
    );
  }

  const radiusLabel = formatDistance(radius);

  return (
    <main className="flex h-dvh flex-col md:flex-row">
      {/* 地图 */}
      <section className="relative min-h-0 flex-1">
        <PlacesMap
          center={coords}
          places={places}
          lang={lang}
          radius={radius}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div className="pointer-events-none absolute inset-x-5 top-5 z-[1000] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            title={t(lang, "changePlace")}
            className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-surface/95 pl-3 pr-4 text-[14px] font-semibold shadow-[0_4px_14px_rgba(27,31,29,0.10)]"
          >
            <PinIcon className="text-accent" />
            <span>{formatCoords(coords.lat, coords.lon)}</span>
          </button>
          <LanguageToggle className="pointer-events-auto" />
        </div>

        <button
          type="button"
          onClick={requestLocation}
          title={t(lang, "locateMe")}
          className="absolute bottom-5 right-5 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_6px_16px_rgba(27,31,29,0.14)]"
        >
          <LocateIcon />
        </button>
      </section>

      {/* 底部面板 / 桌面右栏 */}
      <section className="z-[1001] flex h-[46dvh] shrink-0 flex-col rounded-t-sheet bg-surface shadow-[0_-10px_30px_rgba(27,31,29,0.12)] md:h-auto md:w-[420px] md:rounded-none md:shadow-[-10px_0_30px_rgba(27,31,29,0.08)]">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[#D8D2C6] md:hidden" />
        <InstallHint lang={lang} />

        <header className="flex items-end justify-between px-6 pt-3.5">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-serif text-[28px] leading-8">{t(lang, "aroundYou")}</h1>
            <p className="text-[13px] text-muted">
              {loading ? t(lang, "loadingPlaces") : t(lang, "placesWithin", { n: places.length, r: radiusLabel })}
            </p>
          </div>
          <label className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-semibold">
            <span className="sr-only">{t(lang, "radius")}</span>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="bg-transparent outline-none"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {formatDistance(r)}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-start gap-3 px-6 py-4 text-[14px] text-muted">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-bg"
              >
                {t(lang, "retry")}
              </button>
            </div>
          ) : !loading && places.length === 0 ? (
            <p className="px-6 py-4 text-[14px] text-muted">{t(lang, "noPlaces", { r: radiusLabel })}</p>
          ) : (
            <PlaceList places={places} lang={lang} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
      </section>
    </main>
  );
}
