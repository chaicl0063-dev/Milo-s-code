"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Place } from "@/lib/places/types";
import type { RouteStop } from "@/lib/route";

type Coords = { lat: number; lon: number };

interface Props {
  /** 浏览中心：搜索围绕它进行，可能不是用户所在位置 */
  center: Coords;
  /** 用户真实位置，画蓝点；没拿到定位时为 null */
  myLocation: Coords | null;
  places: Place[];
  radius: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** 用户拖动或缩放地图后，回报新的地图中心 */
  onMoved: (center: Coords) => void;
  /** 今日路线：有就画连线和编号图钉，普通图钉退到后面 */
  route?: { stops: RouteStop[]; current: number; onPick: (index: number) => void } | null;
}

/** MapContainer 的 center 只在首次渲染生效，坐标变化时用这个小组件手动移动视图 */
function Recenter({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], zoom);
  }, [map, lat, lon, zoom]);
  return null;
}

/** 有路线时把视野调整到能看到全部站点 */
function FitRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join(";");
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 16 });
    // key 已经代表 points 的内容
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

function MapWatcher({ onMoved, onBlankClick }: { onMoved: (c: Coords) => void; onBlankClick: () => void }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      onMoved({ lat: c.lat, lon: c.lng });
    },
    click: onBlankClick,
  });
  return null;
}

function zoomForRadius(radius: number): number {
  if (radius <= 500) return 17;
  if (radius <= 1000) return 16;
  if (radius <= 2000) return 15;
  return 14;
}

/* 图钉都用 divIcon 画，样式在 globals.css 的 .rr-* 里 */
const dotIcon = L.divIcon({ className: "", html: '<div class="rr-dot"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
const dotSelectedIcon = L.divIcon({ className: "", html: '<div class="rr-dot rr-dot-selected"></div>', iconSize: [28, 28], iconAnchor: [14, 14] });
const meIcon = L.divIcon({ className: "", html: '<div class="rr-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
const clusterIcon = (cluster: { getChildCount: () => number }) =>
  L.divIcon({ className: "", html: `<div class="rr-cluster">${cluster.getChildCount()}</div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
const numIcon = (n: number, current: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="rr-num${current ? " rr-num-current" : ""}">${n}</div>`,
    iconSize: current ? [32, 32] : [26, 26],
    iconAnchor: current ? [16, 16] : [13, 13],
  });

export default function PlacesMap({ center, myLocation, places, radius, selectedId, onSelect, onMoved, route }: Props) {
  const zoom = zoomForRadius(radius);
  const routeIds = useMemo(() => new Set(route?.stops.map((s) => s.id) ?? []), [route]);
  // 选中的图钉单独画在聚合组外面，保证它永远可见、在最上层；路线上的站也不进聚合组
  const selected = useMemo(() => places.find((p) => p.id === selectedId) ?? null, [places, selectedId]);
  // 路线模式下只画路线上的站：普通图钉和聚合圆的数字会和站点编号混在一起
  const others = useMemo(() => (route ? [] : places.filter((p) => p.id !== selectedId)), [places, selectedId, route]);
  const routePoints = useMemo<[number, number][]>(() => (route ? route.stops.map((s) => [s.lat, s.lon]) : []), [route]);

  return (
    <MapContainer center={[center.lat, center.lon]} zoom={zoom} zoomControl={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {route ? <FitRoute points={routePoints} /> : <Recenter lat={center.lat} lon={center.lon} zoom={zoom} />}
      <MapWatcher onMoved={onMoved} onBlankClick={() => onSelect(null)} />

      {/* 搜索范围：一圈很淡的虚线 */}
      {!route && <Circle center={[center.lat, center.lon]} radius={radius} pathOptions={{ color: "#b85c38", weight: 1, opacity: 0.3, fill: false, dashArray: "4 6" }} />}

      {myLocation && <Marker position={[myLocation.lat, myLocation.lon]} icon={meIcon} interactive={false} zIndexOffset={500} />}

      {/* 图钉聚合：缩得远时合成带数字的圆，放大到街区级自动散开 */}
      <MarkerClusterGroup chunkedLoading maxClusterRadius={44} disableClusteringAtZoom={17} showCoverageOnHover={false} spiderfyOnMaxZoom={false} iconCreateFunction={clusterIcon}>
        {others.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lon]} icon={dotIcon} eventHandlers={{ click: () => onSelect(p.id) }} />
        ))}
      </MarkerClusterGroup>

      {selected && !routeIds.has(selected.id) && (
        <Marker position={[selected.lat, selected.lon]} icon={dotSelectedIcon} zIndexOffset={1000} eventHandlers={{ click: () => onSelect(selected.id) }} />
      )}

      {/* 今日路线：虚线连起来，编号图钉，当前站更大更深 */}
      {route && routePoints.length > 0 && (
        <>
          <Polyline positions={routePoints} pathOptions={{ color: "#b85c38", weight: 3, opacity: 0.9, dashArray: "6 6" }} />
          {route.stops.map((s, i) => (
            <Marker key={s.id} position={[s.lat, s.lon]} icon={numIcon(i + 1, i === route.current)} zIndexOffset={1100} eventHandlers={{ click: () => route.onPick(i) }} />
          ))}
        </>
      )}
    </MapContainer>
  );
}
