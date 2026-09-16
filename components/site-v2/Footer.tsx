import { BRAND, feedbackMailto } from "@/lib/site/brand";
import { PLACE, STREET } from "@/lib/site-v2/content";
import { Icon, container, linkText } from "@/components/site-v2/ui";

/**
 * 页脚。样张几何：一行——左标志 + 品牌，中间灰色链接，右侧一句标语。样张的社交图标没有真实账号，不放。
 * 下面再压一行小字：数据来源、照片署名、插画与肖像的 AI 说明、©。身份信息来自 lib/site/brand.ts。
 */
export function Footer() {
  return (
    <footer className="mt-5 border-t border-(--v2-line) bg-(--v2-bg)">
      <div className={`${container} flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between`}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <a href="#top" className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.01em] text-(--v2-ink)">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-(--v2-accent) text-white" aria-hidden>
              <Icon.Navigate size={16} />
            </span>
            {BRAND.name}
            <span className="rounded-full border border-(--v2-line) px-2 py-0.5 text-[10.5px] font-semibold text-(--v2-muted)">{BRAND.stage}</span>
          </a>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14.5px] font-medium text-(--v2-nav)" aria-label="Footer">
            <a href={BRAND.privacyPath} className={linkText}>
              Privacy
            </a>
            <a href={BRAND.termsPath} className={linkText}>
              Terms
            </a>
            <a href={feedbackMailto("website v2")} className={linkText}>
              Feedback
            </a>
            <a href={`mailto:${BRAND.email}`} className={linkText}>
              Contact
            </a>
          </nav>
        </div>
        <p className="text-[14.5px] text-(--v2-nav)">Understand what&rsquo;s around you, one place at a time.</p>
      </div>
      <div className={`${container} border-t border-(--v2-line) py-3 text-[11px] leading-[1.55] text-(--v2-faint)`}>
        <p>
          Place data from OpenStreetMap, Wikipedia, Wikivoyage, Wikidata and the UNESCO World Heritage List. Stories and answers are AI-generated from those sources; check anything that matters. Photos of {PLACE.name}:{" "}
          <a href={STREET.hero.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {STREET.hero.author} ({STREET.hero.license})
          </a>{" "}
          and{" "}
          <a href={PLACE.photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {PLACE.photo.author} ({PLACE.photo.license})
          </a>
          , via Wikimedia Commons. The route picture in Keep exploring is an AI-generated illustration of a fictional city, not a real map; the two guide portraits are AI-generated images of fictional characters. Places and distances in the demo are a Paris sample, not your location. © {new Date().getFullYear()} {BRAND.operator}.
        </p>
      </div>
    </footer>
  );
}
