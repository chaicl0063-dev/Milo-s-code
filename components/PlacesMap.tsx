"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Place } from "@/lib/places/types";

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
}

/** MapContainer 的 center 只在首次渲染生效，坐标变化时用这个小组件手动移动视图 */
function Recenter({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], zoom);
  }, [map, lat, lon, zoom]);
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

export default function PlacesMap({ center, myLocation, places, radius, selectedId, onSelect, onMoved }: Props) {
  const zoom = zoomForRadius(radius);
  // 选中的图钉单独画在聚合组外面，保证它永远可见、在最上层
  const selected = useMemo(() => places.find((p) => p.id === selectedId) ?? null, [places, selectedId]);
  const others = useMemo(() => places.filter((p) => p.id !== selectedId), [places, selectedId]);

  return (
    <MapContainer center={[center.lat, center.lon]} zoom={zoom} zoomControl={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lon={center.lon} zoom={zoom} />
      <MapWatcher onMoved={onMoved} onBlankClick={() => onSelect(null)} />

      {/* 搜索范围：一圈很淡的虚线 */}
      <Circle center={[center.lat, center.lon]} radius={radius} pathOptions={{ color: "#b85c38", weight: 1, opacity: 0.3, fill: false, dashArray: "4 6" }} />

      {myLocation && <Marker position={[myLocation.lat, myLocation.lon]} icon={meIcon} interactive={false} zIndexOffset={500} />}

      {/* 图钉聚合：缩得远时合成带数字的圆，放大到街区级自动散开 */}
      <MarkerClusterGroup chunkedLoading maxClusterRadius={44} disableClusteringAtZoom={17} showCoverageOnHover={false} spiderfyOnMaxZoom={false} iconCreateFunction={clusterIcon}>
        {others.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lon]} icon={dotIcon} eventHandlers={{ click: () => onSelect(p.id) }} />
        ))}
      </MarkerClusterGroup>

      {selected && <Marker position={[selected.lat, selected.lon]} icon={dotSelectedIcon} zIndexOffset={1000} eventHandlers={{ click: () => onSelect(selected.id) }} />}
    </MapContainer>
  );
}
