import type { PlaceDetail } from "@/lib/places/types";
import { t, type Lang } from "@/lib/i18n";

/** 详情页底部：一排小圆钮，跳到各数据源。字母标识用内联 SVG 画，不依赖外部图片。 */
export function SourceLinks({ links, lang, size = "md" }: { links: PlaceDetail["links"]; lang: Lang; size?: "sm" | "md" }) {
  const items: Array<{ href: string; label: string; glyph: React.ReactNode }> = [];
  if (links.wikipedia) items.push({ href: links.wikipedia, label: t(lang, "readOnWikipedia"), glyph: <WikipediaGlyph /> });
  if (links.osm) items.push({ href: links.osm, label: t(lang, "viewOnOsm"), glyph: <OsmGlyph /> });
  if (links.amap) items.push({ href: links.amap, label: t(lang, "viewOnAmap"), glyph: <AmapGlyph /> });
  if (links.wikidata) items.push({ href: links.wikidata, label: t(lang, "viewOnWikidata"), glyph: <WikidataGlyph /> });
  if (items.length === 0) return null;

  return (
    <ul className={`flex items-center ${size === "sm" ? "gap-2" : "gap-3"}`}>
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            title={item.label}
            aria-label={item.label}
            className={`flex items-center justify-center rounded-full bg-surface-2 text-ink transition-colors hover:bg-line ${size === "sm" ? "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4" : "h-10 w-10"}`}
          >
            {item.glyph}
          </a>
        </li>
      ))}
    </ul>
  );
}

function WikipediaGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="17" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="17" fontWeight="700" fill="currentColor">
        W
      </text>
    </svg>
  );
}

function OsmGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z" />
      <path d="M9 4v13M15 7v13" />
    </svg>
  );
}

function WikidataGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="5" width="2" height="14" />
      <rect x="7" y="5" width="2" height="14" />
      <rect x="11" y="5" width="3" height="14" />
      <rect x="16" y="5" width="2" height="14" />
      <rect x="20" y="5" width="1.5" height="14" />
    </svg>
  );
}

function AmapGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="17" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700" fill="currentColor">
        高
      </text>
    </svg>
  );
}
