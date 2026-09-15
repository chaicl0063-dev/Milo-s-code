"use client";

import { useState } from "react";
import { PHOTOS, type SitePhoto } from "@/lib/site/photos";
import { PlaceDemo } from "@/components/site/PlaceDemo";
import { GuideCompare } from "@/components/site/GuideCompare";
import { useScriptedSpeech } from "@/components/site/useScriptedSpeech";
import { HeroProduct } from "@/components/site/HeroProduct";
import { BRAND, feedbackMailto } from "@/lib/site/brand";
import { T } from "@/lib/site/theme";

/* ------------------------------------------------------------------ */
/* 官网 · 2026-09-15 按 docs/REAROUND-YOU-IMPLEMENTATION-SPEC.md（GPT Work 冻结）重排：
 * Light Tech / Clear / Urban / Human / Product-first。冷浅灰底、单一青蓝交互色、Manrope、1px 细边、极轻阴影。
 * 九屏顺序：Hero → The Moment → See → Listen → Keep Exploring → Guides → Real-world Break → Free / Plus → Final CTA。
 * 产品 UI（真实截图）解释能力，摄影只负责城市情境（S02 / S05 / S07）。文案是冻结值，改动前先改规格。 */
/* ------------------------------------------------------------------ */

/** 一张氛围照片（AI 品牌图或署名的真实照片），懒加载，容器定比例防跳动 */
function Photo({ photo, className = "", sizes, position }: { photo: SitePhoto; className?: string; sizes?: string; position?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.src} srcSet={photo.srcSet} sizes={sizes} alt={photo.alt} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} style={position ? { objectPosition: position } : undefined} />;
}

/** 编号小标签（01 SEE 这一类） */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase leading-[1.3] tracking-[0.06em]" style={{ color: T.accent }}>
      {children}
    </p>
  );
}

/** S02—S07 的二级标题 */
const h2 = "text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] [text-wrap:balance] md:text-[36px] lg:text-[40px] lg:leading-[1.12]";
const lead = "text-[16px] leading-[1.6] lg:text-[18px]";
const container = "mx-auto max-w-[1200px] px-5 md:px-8";
/** 768—1023 用单列平板布局，内容最多 720 宽；≥1024 才双列 */
const tablet = "mx-auto max-w-[720px] lg:max-w-none";

/* ------------------------------------------------------------------ */

export function SiteLanding({ appUrl, apkUrl, apkVersion }: { appUrl: string; apkUrl?: string; apkVersion?: string }) {
  const speech = useScriptedSpeech(appUrl);
  const base = appUrl.replace(/\/$/, "");
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || notify === "sending") return;
    setNotify("sending");
    try {
      const res = await fetch(`${base}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang: "en" }),
      });
      if (!res.ok) throw new Error("bad");
      setNotify("done");
    } catch {
      setNotify("error");
    }
  }

  const btnPrimary = "inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-semibold text-white transition-colors";
  const btnGhost = "inline-flex h-12 items-center justify-center rounded-full border px-6 text-[15px] font-semibold transition-colors";

  return (
    <div className="rr-site min-h-dvh w-full font-sans" style={{ background: T.bg, color: T.ink }}>
      <style>{`
        @keyframes rr-fade { from { opacity: 0; } to { opacity: 1; } }
        .rr-fade { animation: rr-fade 360ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .rr-fade { animation: none; } }
        .rr-site section[id] { scroll-margin-top: 80px; }
        .rr-site :focus-visible { outline: 2px solid ${T.focus}; outline-offset: 3px; }
        .rr-site a.rr-primary:hover, .rr-site button.rr-primary:hover { background: ${T.deep} !important; }
        .rr-site .rr-ghost:hover { background: ${T.paper}; }
      `}</style>

      {/* 顶栏：不透明底 + 1px 底边，不用模糊 */}
      <header className="sticky top-0 z-30 border-b" style={{ background: T.bg, borderColor: T.line }}>
        <div className={`${container} flex h-16 items-center justify-between`}>
          <a href="#top" className="flex items-center gap-2.5 text-[15px] font-semibold" style={{ color: T.ink }}>
            <span className="relative inline-block h-5 w-5 rounded-full" style={{ background: T.ink }}>
              <span className="absolute left-[5px] top-[5px] h-[10px] w-[10px] rounded-full" style={{ background: T.accent }} />
            </span>
            ReAround You
            <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: T.line, color: T.muted }}>
              {BRAND.stage}
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-[13px] font-semibold md:flex" style={{ color: T.muted }}>
            <a href="#how">How it works</a>
            <a href="#guides">Guides</a>
            <a href="#plus">Plus</a>
            <a href={appUrl} className="rounded-full px-4 py-2 text-[13px] font-semibold text-white" style={{ background: T.ink }}>
              Open the app
            </a>
          </nav>
          <a href={appUrl} className="rounded-full px-4 py-2 text-[13px] font-semibold text-white md:hidden" style={{ background: T.ink }}>
            Open
          </a>
        </div>
      </header>

      {/* 01 · Hero：左文案 44，右产品展示板 56。手机：label → h1 → 副题 → 两个按钮 → 小字 → 展示板 */}
      <section id="top" className={`${container} rr-fade pb-12 pt-6 lg:pb-16 lg:pt-12`}>
        <div className={`${tablet} grid items-center gap-6 lg:grid-cols-[44fr_56fr] lg:gap-12`}>
          <div>
            <Label>AI local guide</Label>
            <h1 className="mt-4 text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] [text-wrap:balance] md:text-[44px] lg:text-[56px] lg:leading-[1.08]" style={{ color: T.ink }}>
              Understand the place you&rsquo;re standing in.
            </h1>
            <p className={`${lead} mt-5 max-w-[48ch]`} style={{ color: T.muted }}>
              See what&rsquo;s around you, hear the story behind it, ask questions, and keep exploring.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 lg:mt-8">
              <a href={appUrl} className={`${btnPrimary} rr-primary`} style={{ background: T.accent }}>
                Try your local guide
              </a>
              <a href="#how" className={`${btnGhost} rr-ghost`} style={{ borderColor: T.line, color: T.ink, background: T.white }}>
                See how it works
              </a>
            </div>
            <p className="mt-3 text-[13px] leading-5 lg:mt-4" style={{ color: T.muted }}>
              Free beta in your browser. No account needed.
            </p>
          </div>
          <HeroProduct appUrl={appUrl} onLive={speech.stop} />
        </div>
      </section>

      {/* 02 · The Moment：品牌句 + 一句短文 + 一张大图（桌面 16:9，手机 4:5），文字在图外 */}
      <section id="moment" className={`${container} py-10 lg:py-16`}>
        <div className={tablet}>
          <h2 className={h2} style={{ color: T.ink }}>
            You&rsquo;re already here. Now let&rsquo;s look around.
          </h2>
          <p className={`${lead} mt-3 max-w-[48ch]`} style={{ color: T.muted }}>
            You look up at a place you don&rsquo;t know. Start there.
          </p>
          <div className="mt-8 overflow-hidden rounded-[20px] border aspect-[4/5] md:aspect-[16/9]" style={{ borderColor: T.line, background: T.paper }}>
            <picture>
              {PHOTOS.hero.portraitSrc && <source media="(max-width: 767px)" srcSet={PHOTOS.hero.portraitSrc} />}
              <img src={PHOTOS.hero.src} srcSet={PHOTOS.hero.srcSet} sizes="(min-width: 1200px) 1136px, 100vw" alt={PHOTOS.hero.alt} width={1672} height={940} loading="lazy" decoding="async" className="h-full w-full object-cover object-[50%_30%]" />
            </picture>
          </div>
        </div>
      </section>

      {/* 03 · See：左文字 40，右真实 HomeScreen（地图 + 已选地点卡）60 */}
      <section id="how" className={`${container} py-10 lg:py-16`}>
        <div className={`${tablet} grid items-center gap-6 lg:grid-cols-[2fr_3fr] lg:gap-12`}>
          <div>
            <Label>01 See</Label>
            <h2 className={`${h2} mt-3`} style={{ color: T.ink }}>
              What&rsquo;s that building?
            </h2>
            <p className={`${lead} mt-3 max-w-[48ch]`} style={{ color: T.muted }}>
              Find a place on the map. Tap it to ask your guide.
            </p>
          </div>
          <figure className="mx-auto w-full max-w-[420px] lg:mx-0 lg:ml-auto">
            <div className="overflow-hidden rounded-[20px] border" style={{ aspectRatio: "780 / 1560", borderColor: T.line, background: T.paper, boxShadow: T.shadow }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/app/app-home.webp" alt="ReAround You app: map of the Châtelet area in Paris with nearby places marked, Tour Saint-Jacques selected and its card open with an Ask the guide button" width={780} height={1688} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
            </div>
            <figcaption className="mt-3 text-[13px] leading-5" style={{ color: T.muted }}>
              App view · Paris · sample location · map © OpenStreetMap contributors
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 04 · Listen：左标题 + 短句 + 可操作试听 56，右真实 TalkScreen 摘录 44。手机：标题、短句、App 摘录、再试听 */}
      <section id="demo" className={`${container} py-10 lg:py-16`}>
        <div className={`${tablet} grid gap-6 lg:grid-cols-[56fr_44fr] lg:grid-rows-[auto_1fr] lg:gap-8`}>
          <div className="lg:col-start-1 lg:row-start-1">
            <Label>02 Listen</Label>
            <h2 className={`${h2} mt-3`} style={{ color: T.ink }}>
              Hear the story behind it.
            </h2>
            <p className={`${lead} mt-3 max-w-[48ch]`} style={{ color: T.muted }}>
              Listen to Mia, then ask about what caught your eye.
            </p>
          </div>
          <figure className="mx-auto w-full max-w-[420px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:ml-auto">
            <div className="flex flex-col gap-4 rounded-[20px] border p-3" style={{ borderColor: T.line, background: T.white, boxShadow: T.shadow }}>
              <div className="overflow-hidden rounded-[12px] border" style={{ aspectRatio: "780 / 1000", borderColor: T.line, background: T.paper }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/app/app-talk-top.webp" alt="ReAround You app: Mia's story for Tour Saint-Jacques with the sound switched off, first sentences visible" width={780} height={1000} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
              </div>
              <div className="overflow-hidden rounded-[12px] border" style={{ aspectRatio: "780 / 148", borderColor: T.line, background: T.paper }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/app/app-talk-ask.webp" alt="ReAround You app: the follow-up question bar at the bottom of the story screen" width={780} height={148} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
              </div>
            </div>
            <figcaption className="mt-3 text-[13px] leading-5" style={{ color: T.muted }}>
              App view · sound off in this screenshot · the question bar is part of the screenshot
            </figcaption>
          </figure>
          <div className="lg:col-start-1 lg:row-start-2">
            <PlaceDemo photo={PHOTOS.demoPlace} appUrl={appUrl} speech={speech} />
          </div>
        </div>
      </section>

      {/* 05 · Keep Exploring：左真实路线结果 + 同一路线的地图 60，右标题、短句、步行照片、文本链接 40。
          手机：标题、正文 → 地图 + 路线卡 → 16:9 照片 → 链接 */}
      <section id="explore" className={`${container} py-10 lg:py-16`}>
        <div className={`${tablet} grid gap-6 lg:grid-cols-[3fr_2fr] lg:grid-rows-[auto_auto_auto] lg:gap-12`}>
          <div className="lg:col-start-2 lg:row-start-1">
            <Label>03 Keep exploring</Label>
            <h2 className={`${h2} mt-3`} style={{ color: T.ink }}>
              An hour to wander?
            </h2>
            <p className={`${lead} mt-3 max-w-[48ch]`} style={{ color: T.muted }}>
              Find a short walk with places to stop along the way.
            </p>
          </div>
          <figure className="lg:col-start-1 lg:row-span-3 lg:row-start-1">
            {/* BI-01（第 24 节）：手机单列，地图在前、同一路线的结果在后，截图接近原生 1:0.8 尺寸可读；≥768 才双列 */}
            <div className="grid grid-cols-1 items-start gap-3 rounded-[20px] border p-3 md:grid-cols-2 md:gap-4" style={{ borderColor: T.line, background: T.white, boxShadow: T.shadow }}>
              {/* 同一条路线：地图（编号图钉 + 顺序虚线 + 当前站卡片，裁掉底部 tab），导游页里的结果（原尺寸 780×1247，见 IMAGE-MANIFEST） */}
              <div className="overflow-hidden rounded-[12px] border" style={{ aspectRatio: "780 / 1560", borderColor: T.line, background: T.paper }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/app/app-route-map.webp" alt="ReAround You app: a one-hour walk shown on the map with numbered stops in order, a dotted line between them and the first stop's card" width={780} height={1688} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
              </div>
              <div className="overflow-hidden rounded-[12px] border" style={{ aspectRatio: "780 / 1247", borderColor: T.line, background: T.paper }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/app/app-route.webp" alt="ReAround You app: the same one-hour walk as a list of stops with walking time between them and a Show on map button" width={780} height={1247} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
              </div>
            </div>
            <figcaption className="mt-3 text-[13px] leading-5" style={{ color: T.muted }}>
              Example one-hour walk · route order, not navigation · map © OpenStreetMap contributors
            </figcaption>
          </figure>
          <div className="overflow-hidden rounded-[20px] border aspect-[16/9] lg:col-start-2 lg:row-start-2 lg:aspect-[4/5]" style={{ borderColor: T.line, background: T.paper }}>
            <Photo photo={PHOTOS.walk} sizes="(min-width: 1024px) 440px, 100vw" />
          </div>
          <a href={`${base}/guide`} className="self-start text-[15px] font-semibold underline-offset-2 hover:underline lg:col-start-2 lg:row-start-3" style={{ color: T.accent }}>
            Open the guide →
          </a>
        </div>
      </section>

      {/* 06 · Guides：声音选择面板 */}
      <section id="guides" className={`${container} py-10 lg:py-16`}>
        <div className={tablet}>
          <Label>Your guides</Label>
          <h2 className={`${h2} mt-3`} style={{ color: T.ink }}>
            Choose who&rsquo;s walking with you.
          </h2>
          <div className="mt-8">
            <GuideCompare appUrl={appUrl} speech={speech} />
          </div>
          <p className="mt-6 text-[14px] leading-6" style={{ color: T.muted }}>
            Both speak English, 中文, Español, Français, Deutsch, 日本語, 한국어 and Português.
          </p>
        </div>
      </section>

      {/* 07 · Real-world Break：一张大图（桌面 16:7，手机 4:5）+ 图下浅色字幕条，一句话 */}
      <section id="real-world" className="mx-auto max-w-[1440px] px-5 py-10 lg:py-16">
        <figure>
          <div className="overflow-hidden rounded-[20px] border aspect-[4/5] md:aspect-[16/7]" style={{ borderColor: T.line, background: T.paper }}>
            {/* 手机 4:5 只保留右侧有灯光和行人的那段，不把焦点裁出；桌面 16:7 看整条街 */}
            <Photo photo={PHOTOS.alley} sizes="(min-width: 1440px) 1400px, 100vw" className="object-[74%_50%] md:object-[50%_60%]" />
          </div>
          <figcaption className="mt-3 rounded-[20px] px-6 py-5 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] md:px-8 md:py-6 md:text-[28px]" style={{ background: T.paper, color: T.ink }}>
            Look up. There&rsquo;s more around you than you think.
          </figcaption>
        </figure>
      </section>

      {/* 08 · Free / Plus：一个低对比容器，Free 60 / Plus 40，1px 分隔；整体弱于核心三屏 */}
      <section id="plus" className={`${container} py-8 lg:py-10`}>
        <div className={tablet}>
          <h2 className="text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] lg:text-[28px]" style={{ color: T.ink }}>
            Free during beta. Plus is coming later.
          </h2>
          <div className="mt-6 grid rounded-[20px] border lg:grid-cols-[3fr_2fr]" style={{ borderColor: T.line, background: T.white }}>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="text-[18px] font-semibold" style={{ color: T.ink }}>
                  Free beta
                </span>
                <span className="text-[13px]" style={{ color: T.muted }}>
                  No account needed.
                </span>
              </div>
              <ul className="mt-4 grid gap-2 text-[15px] leading-6 sm:grid-cols-2" style={{ color: T.ink }}>
                {["Places around you", "Stories and follow-up questions", "One-hour walking routes", "Favorites and offline reading"].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: T.accent }} />
                    {x}
                  </li>
                ))}
              </ul>
              <a href={appUrl} className="mt-6 inline-flex h-11 items-center rounded-full border px-5 text-[14px] font-semibold rr-ghost" style={{ borderColor: T.line, color: T.ink }}>
                Open in browser
              </a>
            </div>
            <div className="border-t p-6 md:p-8 lg:border-l lg:border-t-0" style={{ borderColor: T.line }}>
              <div className="flex items-center gap-3">
                <span className="text-[18px] font-semibold" style={{ color: T.ink }}>
                  Plus
                </span>
                <span className="rounded-full border px-2.5 py-0.5 text-[12px] font-semibold" style={{ borderColor: T.line, color: T.muted }}>
                  Coming soon
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-6" style={{ color: T.ink }}>
                Save, adjust and pick up longer routes across days.
              </p>
              <p className="mt-1 text-[13px]" style={{ color: T.muted }}>
                Price to be announced
              </p>
              {notify === "done" ? (
                <p className="mt-6 text-[15px] font-semibold" style={{ color: T.accent }}>
                  You&rsquo;re on the list. We&rsquo;ll write when Plus opens.
                </p>
              ) : (
                <form onSubmit={submitEmail} className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    required
                    aria-label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 min-h-11 min-w-0 flex-none rounded-[12px] border px-4 text-[15px] outline-none sm:flex-1"
                    style={{ borderColor: T.line, background: T.white, color: T.ink }}
                  />
                  <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[14px] font-semibold rr-ghost disabled:opacity-60" style={{ borderColor: T.line, color: T.ink, background: T.white }} disabled={notify === "sending"}>
                    {notify === "sending" ? "Sending…" : "Get notified"}
                  </button>
                </form>
              )}
              {notify === "error" && (
                <p className="mt-2 text-[13px]" style={{ color: T.deep }}>
                  Couldn&rsquo;t save that. Try again in a moment.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 09 · Final CTA：浅色区里的白色展示面，左标题右按钮；Android 条件入口是下方低权重一行 */}
      <section id="download" className={`${container} py-12 lg:py-16`}>
        <div className={`${tablet} rounded-[20px] border p-6 md:p-8 lg:p-10`} style={{ borderColor: T.line, background: T.white }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <h2 className={h2} style={{ color: T.ink }}>
              Start with the street you&rsquo;re on.
            </h2>
            <a href={appUrl} className={`${btnPrimary} rr-primary shrink-0 self-start lg:self-auto`} style={{ background: T.accent }}>
              Try your local guide
            </a>
          </div>
          <p className="mt-5 text-[13px] leading-5" style={{ color: T.muted }}>
            {apkUrl ? (
              <>
                <a href={apkUrl} download className="font-semibold underline-offset-2 hover:underline" style={{ color: T.accent }}>
                  Download Android beta
                </a>
                {apkVersion ? ` · version ${apkVersion}` : ""} · Android 7.0 or newer · needs an internet connection
              </>
            ) : (
              <span>Android beta · coming soon</span>
            )}
          </p>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t" style={{ borderColor: T.line }}>
        <div className={`${container} flex flex-col gap-8 py-10 text-[13px] md:flex-row md:justify-between`} style={{ color: T.muted }}>
          <div className="max-w-[460px]">
            <div className="text-[15px] font-semibold" style={{ color: T.ink }}>
              ReAround You
            </div>
            <p className="mt-2 leading-5">
              Place data from OpenStreetMap, Wikipedia, Wikivoyage, Wikidata and the UNESCO World Heritage List. Stories are AI-generated from those sources; check anything that matters. Map tiles in the app screenshots © OpenStreetMap contributors.
            </p>
            <p className="mt-3 leading-5">
              Photo of Tour Saint-Jacques:{" "}
              {(Object.values(PHOTOS) as SitePhoto[])
                .filter((p) => !p.generated && p.page)
                .map((p) => (
                  <a key={p.page} href={p.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    {p.author} ({p.license})
                  </a>
                ))}
              . Street scenes and the two guide portraits are AI-generated brand images of fictional places and characters.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a href={BRAND.privacyPath} className="font-semibold" style={{ color: T.ink }}>
              Privacy
            </a>
            <a href={BRAND.termsPath} className="font-semibold" style={{ color: T.ink }}>
              Terms
            </a>
            <a href={feedbackMailto("website")} className="font-semibold" style={{ color: T.ink }}>
              Send feedback
            </a>
            <a href={`mailto:${BRAND.email}`} className="font-semibold" style={{ color: T.ink }}>
              {BRAND.email}
            </a>
            <span>
              © {new Date().getFullYear()} {BRAND.operator} · {BRAND.name} {BRAND.stage}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
