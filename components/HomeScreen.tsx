"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/places/types";
import { t } from "@/lib/i18n";
import { formatCoords, formatDistance, haversine, isValidCoords } from "@/lib/geo";
import { homeHref } from "@/lib/links";
import type { City } from "@/lib/cities";
import { readCoords, writeCoords } from "@/lib/prefs";
import { useLanguage } from "@/components/LanguageProvider";
import { LocatePanel } from "@/components/LocatePanel";
import { PlaceList } from "@/components/PlaceList";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/TabBar";
import { BackIcon, LocateIcon, PinIcon, SearchIcon } from "@/components/Icons";

// Leaflet 依赖 window，只能在浏览器端渲染，所以关闭服务端渲染
const PlacesMap = dynamic(() => import("@/components/PlacesMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#ece6da]" />,
});

type Coords = { lat: number; lon: number };
const RADIUS_OPTIONS = [500, 1000, 2000, 5000];
/** 底部面板收起时露出的高度（把手 + 标题行） */
const PEEK_HEIGHT = 136;

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

  // 「浏览中心」和「我的位置」是两回事：搜索围着前者，蓝点画在后者
  const [center, setCenter] = useState<Coords | null>(() => coordsFromParams(searchParams));
  const [myLocation, setMyLocation] = useState<Coords | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const bootedRef = useRef(false);

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
  const places = hasResults ? result.places : [];
  const error = hasResults ? result.error : null;
  // 选中项：优先用户点的，其次 URL 带来的 focus，都没有就第一个
  const effectiveSelected = places.some((p) => p.id === selectedId) ? selectedId : (places[0]?.id ?? null);

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
    requestLocation();
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

  /* ---------- 底部面板拖动：三档停靠（收起 / 半屏 / 接近全屏） ---------- */
  const sheetRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  // 挂载后把默认高度换成像素值：百分比高度和像素之间的过渡在部分浏览器里不会动
  useEffect(() => {
    if (sheetHeight !== null || !center) return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSheetHeight(Math.round((window.innerHeight - TAB_BAR_HEIGHT) * 0.46));
  }, [center, sheetHeight]);

  function usableHeight() {
    return window.innerHeight - TAB_BAR_HEIGHT;
  }
  function snapPoints() {
    const vh = usableHeight();
    return [PEEK_HEIGHT, Math.round(vh * 0.46), Math.round(vh * 0.88)];
  }
  function currentSheetHeight() {
    return sheetRef.current?.getBoundingClientRect().height ?? 0;
  }
  function onHandlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(min-width: 768px)").matches) return; // 桌面是右栏，不拖
    if ((e.target as HTMLElement).closest("select,button,a")) return;
    dragRef.current = { startY: e.clientY, startH: currentSheetHeight() };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onHandlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const max = Math.round(usableHeight() * 0.88);
    const h = Math.min(Math.max(dragRef.current.startH - (e.clientY - dragRef.current.startY), PEEK_HEIGHT), max);
    setSheetHeight(h);
  }
  function onHandlePointerUp() {
    if (!dragRef.current) return;
    const h = currentSheetHeight();
    const nearest = snapPoints().reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a));
    setSheetHeight(nearest);
    dragRef.current = null;
    setDragging(false);
  }
  /** 点一下把手：半屏和全屏之间切换 */
  function toggleSheet() {
    const snaps = snapPoints();
    const h = currentSheetHeight();
    const idx = snaps.reduce((best, s, i) => (Math.abs(s - h) < Math.abs(snaps[best] - h) ? i : best), 0);
    setSheetHeight(snaps[idx === 2 ? 1 : 2]);
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
        onAllowLocation={() => requestLocation()}
        onPickCity={pickCity}
        onCoords={applyCenter}
      />
    );
  }

  const radiusLabel = formatDistance(radius);

  return (
    <>
      <main
        className="flex flex-col md:flex-row"
        style={{ height: `calc(100dvh - ${TAB_BAR_HEIGHT}px - env(safe-area-inset-bottom))` }}
      >
        {/* 地图 */}
        <section className="relative min-h-0 flex-1">
          <PlacesMap
            center={center}
            myLocation={myLocation}
            places={places}
            lang={lang}
            radius={radius}
            selectedId={effectiveSelected}
            onSelect={setSelectedId}
            onMoved={onMapMoved}
          />

          <div className="pointer-events-none absolute inset-x-5 top-5 z-[1000] flex items-center gap-2">
            {focusId && (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label={t(lang, "back")}
                className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface/95 text-ink shadow-[0_4px_14px_rgba(27,31,29,0.10)]"
              >
                <BackIcon />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              title={t(lang, "changePlace")}
              className="pointer-events-auto flex h-11 min-w-0 items-center gap-2 rounded-full bg-surface/95 pl-3 pr-4 text-[14px] font-semibold shadow-[0_4px_14px_rgba(27,31,29,0.10)]"
            >
              <PinIcon className="shrink-0 text-accent" />
              <span className="truncate">{placeName ?? formatCoords(center.lat, center.lon)}</span>
            </button>
          </div>

          {pendingCenter && (
            <button
              type="button"
              onClick={() => applyCenter(pendingCenter)}
              className="absolute left-1/2 top-[76px] z-[1000] flex h-10 -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-bold text-bg shadow-[0_6px_16px_rgba(27,31,29,0.2)]"
            >
              <SearchIcon size={16} />
              <span>{t(lang, "searchThisArea")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={goToMyLocation}
            title={t(lang, "myLocation")}
            className="absolute bottom-5 right-5 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_6px_16px_rgba(27,31,29,0.14)]"
          >
            <LocateIcon />
          </button>
        </section>

        {/* 底部面板（手机可拖）/ 桌面右栏 */}
        <section
          ref={sheetRef}
          style={sheetHeight !== null ? { height: sheetHeight } : undefined}
          className={`z-[1001] flex h-[46%] shrink-0 flex-col rounded-t-sheet bg-surface shadow-[0_-10px_30px_rgba(27,31,29,0.12)] md:!h-auto md:w-[420px] md:rounded-none md:shadow-[-10px_0_30px_rgba(27,31,29,0.08)] ${
            dragging ? "" : "transition-[height] duration-200 ease-out"
          }`}
        >
          {/* 把手 + 标题行 = 拖动区 */}
          <div
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            className="touch-none select-none"
          >
            <button
              type="button"
              onClick={toggleSheet}
              aria-label={t(lang, "sheetHandle")}
              className="mx-auto flex h-6 w-full items-center justify-center md:hidden"
            >
              <span className="h-1 w-10 rounded-full bg-[#D8D2C6]" />
            </button>
            <header className="flex items-end justify-between px-6 pt-1 md:pt-5">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h1 className="font-serif text-[28px] leading-8">{t(lang, "aroundYou")}</h1>
                <p className="truncate text-[13px] text-muted">
                  {loading
                    ? t(lang, "loadingPlaces")
                    : partial
                      ? `${t(lang, "placesWithin", { n: places.length, r: radiusLabel })} · ${t(lang, "loadingMore")}`
                      : t(lang, "placesWithin", { n: places.length, r: radiusLabel })}
                </p>
              </div>
              <label className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-semibold">
                <span className="sr-only">{t(lang, "radius")}</span>
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="bg-transparent outline-none">
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {formatDistance(r)}
                    </option>
                  ))}
                </select>
              </label>
            </header>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {error ? (
              <div className="flex flex-col items-start gap-3 px-6 py-4 text-[14px] text-muted">
                <span>{error}</span>
                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-bg">
                  {t(lang, "retry")}
                </button>
              </div>
            ) : loading ? (
              <SkeletonList />
            ) : places.length === 0 ? (
              <p className="px-6 py-4 text-[14px] text-muted">{t(lang, "noPlaces", { r: radiusLabel })}</p>
            ) : (
              <PlaceList places={places} lang={lang} selectedId={effectiveSelected} onSelect={setSelectedId} />
            )}
          </div>
        </section>
      </main>
      <TabBar lang={lang} />
    </>
  );
}

/** 加载中的占位行，形状和真实列表一致 */
function SkeletonList() {
  return (
    <ul className="flex flex-col gap-1 px-3 pb-6" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
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
