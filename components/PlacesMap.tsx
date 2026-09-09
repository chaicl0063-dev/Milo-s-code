"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { Place } from "@/lib/places/types";
import { t, type Lang } from "@/lib/i18n";
import { formatDistance } from "@/lib/geo";
import { placeHref } from "@/lib/links";

interface Props {
  center: { lat: number; lon: number };
  places: Place[];
  lang: Lang;
  radius: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** MapContainer 的 center 只在首次渲染生效，坐标变化时用这个小组件手动移动视图 */
function Recenter({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], zoom);
  }, [map, lat, lon, zoom]);
  return null;
}

function zoomForRadius(radius: number): number {
  if (radius <= 500) return 17;
  if (radius <= 1000) return 16;
  if (radius <= 2000) return 15;
  return 14;
}

export default function PlacesMap({ center, places, lang, radius, selectedId, onSelect }: Props) {
  const zoom = zoomForRadius(radius);
  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={zoom}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lon={center.lon} zoom={zoom} />

      {/* 当前位置：一圈淡蓝光晕 + 实心蓝点 */}
      <CircleMarker
        center={[center.lat, center.lon]}
        radius={24}
        pathOptions={{ stroke: false, fillColor: "#2f6b8a", fillOpacity: 0.16 }}
      />
      <CircleMarker
        center={[center.lat, center.lon]}
        radius={8}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2f6b8a", fillOpacity: 1 }}
      >
        <Popup>{t(lang, "yourLocation")}</Popup>
      </CircleMarker>

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
