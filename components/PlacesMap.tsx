"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Place } from "@/lib/places/types";
import { t, type Lang } from "@/lib/i18n";
import { formatDistance } from "@/lib/geo";
import { placeHref } from "@/lib/links";

type Coords = { lat: number; lon: number };

interface Props {
  /** 浏览中心：搜索围绕它进行，可能不是用户所在位置 */
  center: Coords;
  /** 用户真实位置，画蓝点；没拿到定位时为 null */
  myLocation: Coords | null;
  places: Place[];
  lang: Lang;
  radius: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
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

function MoveWatcher({ onMoved }: { onMoved: (c: Coords) => void }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      onMoved({ lat: c.lat, lon: c.lng });
    },
  });
  return null;
}

function zoomForRadius(radius: number): number {
  if (radius <= 500) return 17;
  if (radius <= 1000) return 16;
  if (radius <= 2000) return 15;
  return 14;
}

export default function PlacesMap({ center, myLocation, places, lang, radius, selectedId, onSelect, onMoved }: Props) {
  const zoom = zoomForRadius(radius);
  return (
    <MapContainer center={[center.lat, center.lon]} zoom={zoom} zoomControl={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lon={center.lon} zoom={zoom} />
      <MoveWatcher onMoved={onMoved} />

      {/* 搜索范围：一圈很淡的线 */}
      <Circle
        center={[center.lat, center.lon]}
        radius={radius}
        pathOptions={{ color: "#b85c38", weight: 1, opacity: 0.3, fill: false, dashArray: "4 6" }}
      />

      {/* 我的位置：一圈淡蓝光晕 + 实心蓝点 */}
      {myLocation && (
        <>
          <CircleMarker
            center={[myLocation.lat, myLocation.lon]}
            radius={24}
            pathOptions={{ stroke: false, fillColor: "#2f6b8a", fillOpacity: 0.16 }}
          />
          <CircleMarker
            center={[myLocation.lat, myLocation.lon]}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2f6b8a", fillOpacity: 1 }}
          >
            <Popup>{t(lang, "yourLocation")}</Popup>
          </CircleMarker>
        </>
      )}

      {places.map((p) => {
        const selected = p.id === selectedId;
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lon]}
            radius={selected ? 12 : 9}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: selected ? "#1b1f1d" : "#b85c38",
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(p.id) }}
          >
            <Popup>
              <strong>{p.title}</strong>
              <br />
              {formatDistance(p.dist)} · <Link href={placeHref(lang, p.id)}>{t(lang, "view")}</Link>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
