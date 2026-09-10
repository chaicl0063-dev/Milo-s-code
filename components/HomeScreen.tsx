"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Place, PlaceCategory } from "@/lib/places/types";
import { t } from "@/lib/i18n";
import { formatCoords, formatDistance, haversine, isValidCoords } from "@/lib/geo";
import { homeHref } from "@/lib/links";
import type { City } from "@/lib/cities";
import { isOnboarded, readCoords, resolveGuideLang, writeCoords } from "@/lib/prefs";
import { useFavorites } from "@/lib/favorites";
import { useLanguage } from "@/components/LanguageProvider";
import { LocatePanel } from "@/components/LocatePanel";
import { Onboarding } from "@/components/Onboarding";
import { PhotoIdentify } from "@/components/PhotoIdentify";
import { PlaceList } from "@/components/PlaceList";
import { PlaceCard } from "@/components/PlaceCard";
import { HomeHeader, type HomeFilter, type HomeView } from "@/components/HomeHeader";
import { Splash } from "@/components/Splash";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/TabBar";
import { LocateIcon, SearchIcon } from "@/components/Icons";

// Leaflet 依赖 window，只能在浏览器端渲染，所以关闭服务端渲染
const PlacesMap = dynamic(() => import("@/components/PlacesMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#ece6da]" />,
});

type Coords = { lat: number; lon: number };
const RADIUS_OPTIONS = [500, 1000, 2000, 5000];

function coordsFromParams(sp: URLSearchParams): Coords | null {
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  return sp.has("lat") && isValidCoords(lat, lon) ? { lat, lon } : null;
}

interface NearbyResult {
  key: string;
  places: Place[];
  /** false = 只有 Wikipedia 的快速结果，完整结果还在路上 */
  complete: boolean;
  error: string | null;
}

export function HomeScreen() {
  const { lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const { favorites } = useFavorites();

  // 「浏览中心」和「我的位置」是两回事：搜索围着前者，蓝点画在后者
  const [center, setCenter] = useState<Coords | null>(() => coordsFromParams(searchParams));
  const [myLocation, setMyLocation] = useState<Coords | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  /** 拍照识别没匹配上周边地点时，带着识别出的名字打开选地面板 */
  const [pickerQuery, setPickerQuery] = useState("");
  const [locating, setLocating] = useState(false);
  /** null = 还没读本地标记；false = 要先走首次引导 */
  const [onboarded, setOnboardedState] = useState<boolean | null>(null);
  const bootedRef = useRef(false);

  const [view, setView] = useState<HomeView>("map");
  const [filter, setFilter] = useState<HomeFilter>("all");
  const [radius, setRadius] = useState(1000);
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  const [reloadKey, setReloadKey] = useState(0);
  /** 用户把地图拖远了但还没点「搜索这一片」 */
  const [pendingCenter, setPendingCenter] = useState<Coords | null>(null);

  const [result, setResult] = useState<NearbyResult>({ key: "", places: [], complete: false, error: null });
  const requestKey = center ? `${center.lat},${center.lon},${lang},${radius},${reloadKey}` : null;
  const hasResults = requestKey !== null && result.key === requestKey;
  const loading = requestKey !== null && !hasResults;
  const partial = hasResults && !result.complete;
  const places = useMemo(() => (hasResults ? result.places : []), [hasResults, result.places]);
  const error = hasResults ? result.error : null;

  // 筛选：全部 / 收藏 / 某个分类
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const categories = useMemo(() => {
    const seen = new Set<PlaceCategory>();
    for (const p of places) if (p.category && p.category !== "other") seen.add(p.category);
    return [...seen];
  }, [places]);
  const visiblePlaces = useMemo(() => {
    if (filter === "all") return places;
    if (filter === "favorites") return places.filter((p) => favoriteIds.has(p.id));
    return places.filter((p) => p.category === filter);
  }, [places, filter, favoriteIds]);
  const selectedPlace = visiblePlaces.find((p) => p.id === selectedId) ?? null;

  // 浏览中心的地名（反向地理编码）
  const centerKey = center ? `${center.lat.toFixed(3)},${center.lon.toFixed(3)},${lang}` : "";
  const [geo, setGeo] = useState<{ key: string; name: string | null }>({ key: "", name: null });
  const placeName = geo.key === centerKey ? geo.name : null;

  const canUseGeolocation = typeof navigator !== "undefined" && "geolocation" in navigator;

  /** 换一个浏览中心：更新状态、URL 和本地记录 */
  const applyCenter = useCallback(
    (next: Coords) => {
      setCenter(next);
      setPendingCenter(null);
      setShowPicker(false);
      setPickerQuery("");
      setSelectedId(null);
      writeCoords("center", next);
      router.replace(homeHref(next.lat, next.lon));
    },
    [router],
  );

  /** 向浏览器要定位。silent = 已授权时后台刷新蓝点，不弹窗也不改浏览中心 */
  const requestLocation = useCallback(
    (opts: { silent?: boolean } = {}) => {
      if (!canUseGeolocation) {
        if (!opts.silent) setShowPicker(true);
        return;
      }
      if (!opts.silent) setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocating(false);
          setMyLocation(c);
          writeCoords("myLocation", c);
          if (!opts.silent) applyCenter(c);
        },
        () => {
          setLocating(false);
          if (!opts.silent) setShowPicker(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
      );
    },
    [applyCenter, canUseGeolocation],
  );

  /** 如果用户以前已经授权过定位，就静默刷新一次我的位置（不会弹授权框） */
  const refreshLocationIfGranted = useCallback(() => {
    if (!canUseGeolocation || !navigator.permissions?.query) return;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((p) => {
        if (p.state === "granted") requestLocation({ silent: true });
      })
      .catch(() => {});
  }, [canUseGeolocation, requestLocation]);

  // 首次进入：URL 中心 > 上次的中心 > 上次的位置 > 请求定位。localStorage 只能在浏览器读，所以放 effect。
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const done = isOnboarded();
    setOnboardedState(done);
    const savedMy = readCoords("myLocation");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedMy) setMyLocation(savedMy);
    if (center) {
      refreshLocationIfGranted();
      return;
    }
    const savedCenter = readCoords("center") ?? savedMy;
    if (savedCenter) {
      setCenter(savedCenter);
      refreshLocationIfGranted();
      return;
    }
    // 首次进入：先走「选择您的导游」，完成后再请求定位（见 Onboarding 的 onDone）
    if (done) requestLocation();
  }, [center, refreshLocationIfGranted, requestLocation]);

  // 两段加载：先要 Wikipedia 的快速结果，再要完整结果；谁先到谁先显示，完整结果到了覆盖
  useEffect(() => {
    if (!center || !requestKey) return;
    const controller = new AbortController();
    const base = `/api/nearby?lat=${center.lat}&lon=${center.lon}&lang=${lang}&radius=${radius}`;
    let fullDone = false;

    fetch(`${base}&sources=fast`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { places: Place[] } | null) => {
        if (!data || fullDone) return;
        setResult((prev) => (prev.key === requestKey && prev.complete ? prev : { key: requestKey, places: data.places, complete: false, error: null }));
      })
      .catch(() => {});

    fetch(base, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { places: Place[] };
        fullDone = true;
        setResult({ key: requestKey, places: data.places, complete: true, error: null });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        fullDone = true;
        setResult((prev) =>
          prev.key === requestKey
            ? { ...prev, complete: true, error: prev.places.length ? null : t(lang, "loadError") }
            : { key: requestKey, places: [], complete: true, error: t(lang, "loadError") },
        );
      });

    return () => controller.abort();
  }, [center, lang, radius, requestKey]);

  // 浏览中心的地名
  useEffect(() => {
    if (!center || !centerKey) return;
    const controller = new AbortController();
    fetch(`/api/geocode?lat=${center.lat}&lon=${center.lon}&lang=${lang}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((d: { name?: string | null }) => setGeo({ key: centerKey, name: d.name ?? null }))
      .catch(() => {});
    return () => controller.abort();
  }, [center, centerKey, lang]);

  /** 地图被拖动或缩放：离当前中心够远才提示「搜索这一片」 */
  const onMapMoved = useCallback(
    (c: Coords) => {
      if (!center) return;
      const d = haversine(center.lat, center.lon, c.lat, c.lon);
      setPendingCenter(d > radius * 0.4 ? c : null);
    },
    [center, radius],
  );

  function pickCity(city: City) {
    applyCenter({ lat: city.lat, lon: city.lon });
  }

  function goToMyLocation() {
    if (myLocation) applyCenter(myLocation);
    requestLocation({ silent: Boolean(myLocation) });
  }

  // 首次进入：选择导游（语言 + 受众），完成后进入定位授权
  if (onboarded === false) {
    return (
      <Onboarding
        lang={lang}
        onDone={() => {
          setOnboardedState(true);
          if (!center) requestLocation();
        }}
      />
    );
  }

  // 还没有中心，或用户主动要换地方：显示选城市面板
  if (!center || showPicker) {
    if (!center && !showPicker && !locating) {
      return null; // 首次渲染，还没决定要定位还是显示选城市面板
    }
    if (!center && locating && !showPicker) {
      return <div className="flex min-h-dvh items-center justify-center text-[15px] text-muted">{t(lang, "locating")}</div>;
    }
    return (
      <LocatePanel
        lang={lang}
        locating={locating}
        canUseGeolocation={canUseGeolocation}
        onClose={
          center
            ? () => {
                setShowPicker(false);
                setPickerQuery("");
              }
            : undefined
        }
        near={center}
        initialQuery={pickerQuery}
        onAllowLocation={() => requestLocation()}
        onPickCity={pickCity}
        onCoords={applyCenter}
      />
    );
  }

  const radiusLabel = formatDistance(radius);
  const header = (
    <HomeHeader
      lang={lang}
      placeName={placeName ?? formatCoords(center.lat, center.lon)}
      showBack={Boolean(focusId)}
      onBack={() => router.back()}
      onOpenSearch={() => setShowPicker(true)}
      view={view}
      onView={setView}
      filter={filter}
      onFilter={setFilter}
      categories={categories}
      radius={radius}
      radiusOptions={RADIUS_OPTIONS}
      onRadius={setRadius}
      overlay={view === "map"}
    />
  );
  const statusLine = loading
    ? t(lang, "loadingPlaces")
    : partial
      ? `${t(lang, "placesWithin", { n: visiblePlaces.length, r: radiusLabel })} · ${t(lang, "loadingMore")}`
      : t(lang, "placesWithin", { n: visiblePlaces.length, r: radiusLabel });

  if (view === "list") {
    return (
      <>
        <Splash ready={hasResults} />
        <main className="mx-auto flex w-full max-w-[520px] flex-col" style={{ paddingBottom: `calc(${TAB_BAR_HEIGHT + 16}px + env(safe-area-inset-bottom))` }}>
          {header}
          <p className="px-6 pb-1 pt-2 text-[13px] text-muted">{statusLine}</p>
          {error ? (
            <div className="flex flex-col items-start gap-3 px-6 py-4 text-[14px] text-muted">
              <span>{error}</span>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-bg">
                {t(lang, "retry")}
              </button>
            </div>
          ) : loading ? (
            <SkeletonList />
          ) : visiblePlaces.length === 0 ? (
            <p className="px-6 py-4 text-[14px] text-muted">{t(lang, "noPlaces", { r: radiusLabel })}</p>
          ) : (
            <PlaceList places={visiblePlaces} lang={lang} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </main>
        <TabBar lang={lang} />
      </>
    );
  }

  return (
    <>
      <Splash ready={hasResults} />
      <main className="relative" style={{ height: `calc(100dvh - ${TAB_BAR_HEIGHT}px - env(safe-area-inset-bottom))` }}>
        <PlacesMap
          center={center}
          myLocation={myLocation}
          places={visiblePlaces}
          radius={radius}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMoved={onMapMoved}
        />

        {header}

        {pendingCenter && (
          <button
            type="button"
            onClick={() => applyCenter(pendingCenter)}
            className="absolute left-1/2 top-[128px] z-[1000] flex h-10 -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-bold text-bg shadow-[0_6px_16px_rgba(27,31,29,0.2)]"
          >
            <SearchIcon size={16} />
            <span>{t(lang, "searchThisArea")}</span>
          </button>
        )}

        {/* 底部：有选中就是卡片，否则是状态行 + 右侧按钮 */}
        {selectedPlace ? (
          <div className="absolute inset-x-4 bottom-4 z-[1000]">
            <PlaceCard place={selectedPlace} lang={lang} onClose={() => setSelectedId(null)} />
          </div>
        ) : (
          <>
            <div className="pointer-events-none absolute bottom-5 left-4 z-[1000] rounded-full bg-surface/95 px-3.5 py-2 text-[12px] font-semibold text-muted shadow-[0_4px_14px_rgba(27,31,29,0.10)]">
              {error ?? statusLine}
            </div>
            <div className="absolute bottom-5 right-4 z-[1000] flex flex-col gap-3">
              <PhotoIdentify
                lang={lang}
                guideLang={resolveGuideLang(lang)}
                candidates={places}
                onSearchName={(name) => {
                  setPickerQuery(name);
                  setShowPicker(true);
                }}
              />
              <button
                type="button"
                onClick={goToMyLocation}
                title={t(lang, "myLocation")}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_6px_16px_rgba(27,31,29,0.14)]"
              >
                <LocateIcon />
              </button>
            </div>
          </>
        )}
      </main>
      <TabBar lang={lang} />
    </>
  );
}

/** 加载中的占位行，形状和真实列表一致 */
function SkeletonList() {
  return (
    <ul className="flex flex-col gap-1 px-3 pb-6" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3.5 px-2 py-2.5">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-[14px] bg-surface-2" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-3 w-10 animate-pulse rounded bg-surface-2" />
        </li>
      ))}
    </ul>
  );
}
