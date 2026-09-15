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
/* 官网：暖阳配色（暖白 / 墨 / 陶土橙），浅色、产品优先（DESIGN.md，2026-09-15 用户定「浅色底」）。首屏是真机截图里的真应用。 */
/* ------------------------------------------------------------------ */


function Photo({ photo, className = "", style }: { photo: SitePhoto; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.src} alt={photo.alt} loading="lazy" className={`h-full w-full object-cover ${className}`} style={style} />;
}

/* ------------------------------------------------------------------ */

export function SiteLanding({ appUrl, apkUrl, apkVersion }: { appUrl: string; apkUrl?: string; apkVersion?: string }) {
  const speech = useScriptedSpeech(appUrl);
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || notify === "sending") return;
    setNotify("sending");
    try {
      const res = await fetch(`${appUrl.replace(/\/$/, "")}/api/signup`, {
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

  const btnPrimary = "inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5";
  const btnGhost = "inline-flex h-12 items-center justify-center rounded-full border px-6 text-[15px] font-semibold transition-colors";

  return (
    <div className="min-h-dvh w-full font-sans" style={{ background: T.bg, color: T.ink }}>
      <style>{`
        @keyframes rr-wave { from { transform: scaleY(0.4); } to { transform: scaleY(1.4); } }
        @keyframes rr-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .rr-up { animation: rr-up 540ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .rr-up-2 { animation-delay: 120ms; }
        .rr-up-3 { animation-delay: 240ms; }
        @media (prefers-reduced-motion: reduce) { @keyframes rr-up { from { opacity: 0; } to { opacity: 1; } } }
        .rr-nav { background: rgba(247,247,245,0.82); backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px); box-shadow: 0 1px 0 rgba(31,29,26,0.06); }
      `}</style>

      {/* 顶栏 */}
      <header className="rr-nav sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <a href="#top" className="flex items-center gap-2.5 text-[15px] font-bold" style={{ color: T.ink }}>
            <span className="relative inline-block h-5 w-5 rounded-full" style={{ background: T.ink }}>
              <span className="absolute left-[5px] top-[5px] h-[10px] w-[10px] rounded-full" style={{ background: T.accent }} />
            </span>
            ReAround You
            <span className="rounded-full border px-2 py-0.5 text-[11px] font-bold" style={{ borderColor: T.line, color: T.muted }}>
              {BRAND.stage}
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-[13px] font-semibold md:flex" style={{ color: T.muted }}>
            <a href="#how">How it works</a>
            <a href="#guides">Guides</a>
            <a href="#plus">Plus</a>
            <a href={appUrl} className="rounded-full px-4 py-2 text-[13px] font-bold" style={{ background: T.ink, color: T.bg }}>
              Open the app
            </a>
          </nav>
          <a href={appUrl} className="rounded-full px-4 py-2 text-[13px] font-bold md:hidden" style={{ background: T.ink, color: T.bg }}>
            Open
          </a>
        </div>
      </header>

      {/* 首屏（DESIGN.md · 2026-09-15）：左文案，右真机里的真应用。产品即主视觉，照片退到后面的段落 */}
      <section id="top" className="mx-auto max-w-[1200px] px-5 pb-16 pt-10 md:px-8 md:pb-28 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[52fr_48fr] md:gap-10">
          <div>
            <p className="rr-up text-[12px] font-semibold tracking-[0.04em]" style={{ color: T.deep }}>
              AI local guide · {BRAND.stage}
            </p>
            <h1 className="rr-up rr-up-2 mt-4 max-w-[560px] text-[44px] font-semibold leading-[1.05] tracking-[-0.025em] [text-wrap:balance] md:text-[64px]" style={{ color: T.ink }}>
              Understand the place you&rsquo;re standing in.
            </h1>
            <p className="rr-up rr-up-3 mt-6 max-w-[460px] text-[17px] leading-7 md:text-[19px]" style={{ color: T.muted }}>
              See what&rsquo;s around you, hear the story behind it, ask questions, and keep exploring. Any city, in your language.
            </p>
            <div className="rr-up rr-up-3 mt-8 flex flex-wrap items-center gap-3">
              <a href={appUrl} className={btnPrimary} style={{ background: T.accent }}>
                Try it where I am
              </a>
              <a href="#how" className={btnGhost} style={{ borderColor: T.line, color: T.ink, background: T.white }}>
                See how it works
              </a>
            </div>
            <p className="rr-up rr-up-3 mt-4 text-[13px]" style={{ color: T.muted }}>
              Free beta in your browser, no account needed. Android beta app for direct download below.
            </p>
          </div>

          <div className="rr-up rr-up-2 flex justify-center md:justify-end">
            <HeroProduct appUrl={appUrl} />
          </div>
        </div>
      </section>

      {/* 试听一段：真实地点，脚本化的讲解与追问（I01）。从首屏移到这里，照片在这一段里 */}
      <section id="demo" className="mx-auto max-w-[1200px] px-5 pb-16 md:px-8 md:pb-24">
        <div className="grid items-start gap-8 md:grid-cols-[44fr_56fr] md:gap-12">
          <div className="md:pt-6">
            <p className="text-[12px] font-semibold tracking-[0.04em]" style={{ color: T.deep }}>
              Hear a story
            </p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[44px]" style={{ color: T.ink }}>
              One real place, the way a guide would tell it.
            </h2>
            <p className="mt-4 max-w-[440px] text-[16px] leading-7" style={{ color: T.muted }}>
              This is a scripted sample from a real tower in Paris, read by Mia&rsquo;s real voice. In the app the story is generated for the place in front of you.
            </p>
            <div className="mt-6 overflow-hidden rounded-[20px]" style={{ aspectRatio: "4 / 3" }}>
              <picture>
                {PHOTOS.hero.portraitSrc && <source media="(max-width: 767px)" srcSet={PHOTOS.hero.portraitSrc} />}
                <img src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} loading="lazy" className="h-full w-full object-cover object-[50%_30%]" />
              </picture>
            </div>
          </div>
          <div className="pt-28 md:pt-24">
            <PlaceDemo photo={PHOTOS.demoPlace} appUrl={appUrl} speech={speech} />
          </div>
        </div>
      </section>

      {/* 怎么用：三步 */}
      <section id="how" className="mx-auto max-w-[1200px] px-5 pb-6 md:px-8 md:pb-10">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: T.gold }}>
          How it works
        </p>
        <h2 className="mt-3 max-w-[700px] font-semibold tracking-[-0.02em] text-[36px] leading-[1.08] md:text-[56px]">Three seconds from &ldquo;what&rsquo;s that?&rdquo; to knowing.</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            { n: "1", t: "Open the map", d: "Everything worth a look within a kilometre, from world heritage to the odd little chapel nobody photographs." },
            { n: "2", t: "Tap what you see", d: "Or point the camera at it. Your guide recognises the place and picks up where the plaque leaves off." },
            { n: "3", t: "Listen and ask", d: "A minute of story in your language, then keep talking. Why the street bends. Where to eat after." },
          ].map((s) => (
            <li key={s.n} className="rounded-[24px] p-7" style={{ background: T.paper }}>
              <div className="font-semibold tracking-[-0.02em] text-[40px] leading-none" style={{ color: T.accent }}>
                {s.n}
              </div>
              <h3 className="mt-4 text-[20px] font-bold">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-6" style={{ color: T.muted }}>
                {s.d}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 不用做攻略：左照片加路线，右对话 */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
            <Photo photo={PHOTOS.square} />
            <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden>
              <path d="M70 250 L140 190 L215 175 L300 105" stroke="#fff" strokeWidth="6" strokeDasharray="10 8" fill="none" opacity="0.9" />
              <path d="M70 250 L140 190 L215 175 L300 105" stroke={T.accent} strokeWidth="3" strokeDasharray="10 8" fill="none" />
              {[
                [70, 250],
                [140, 190],
                [215, 175],
                [300, 105],
              ].map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="15" fill={i === 0 ? T.ink : T.accent} stroke="#fff" strokeWidth="3" />
                  <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="system-ui">
                    {i + 1}
                  </text>
                </g>
              ))}
            </svg>
            <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-[13px] font-semibold" style={{ color: T.ink }}>
              4 stops · 2.1 km · about 2 hours
            </div>
          </div>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: T.gold }}>
              No planning needed
            </p>
            <h2 className="mt-3 font-semibold tracking-[-0.02em] text-[36px] leading-[1.08] md:text-[52px]">Tell it where you are and how long you have.</h2>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.muted }}>Sample conversation</p>
            <div className="mt-8 flex flex-col gap-3">
              <div className="self-end max-w-[85%] rounded-[18px] rounded-br-[6px] px-4 py-2.5 text-[15px] leading-6 text-white" style={{ background: T.ink }}>
                I&rsquo;m by the cathedral, two hours to spare.
              </div>
              <div className="flex items-end gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/mia-96.jpg" alt="" aria-hidden width={30} height={30} className="h-[30px] w-[30px] shrink-0 rounded-full object-cover" />
                <div className="max-w-[90%] rounded-[18px] rounded-bl-[6px] px-4 py-3 text-[15px] leading-6" style={{ background: T.paper, color: "#2E2A25" }}>
                  Then let&rsquo;s start small. Six minutes north there&rsquo;s a tiled courtyard from the 1700s. From there I&rsquo;ll take you through three side streets and drop you back
                  by the river around sunset.
                </div>
              </div>
              <a href={appUrl} className="ml-10 mt-1 text-[15px] font-bold" style={{ color: T.deep }}>
                Plan my day →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 它知道的不只是景点：三张大图错落 */}
      <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-16">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: T.gold }}>
          More than the sights
        </p>
        <h2 className="mt-3 max-w-[760px] font-semibold tracking-[-0.02em] text-[36px] leading-[1.08] md:text-[56px]">You&rsquo;re already here. Now let&rsquo;s look around.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-12">
          {[
            { photo: PHOTOS.look, k: "Look", q: "Point the camera at anything on this street. I'll tell you what it is and what it was.", span: "md:col-span-7 md:row-span-2", ratio: "aspect-[4/3] md:aspect-auto md:h-full" },
            { photo: PHOTOS.walk, k: "Walk", q: "An hour to spare? I'll string together three stops you can reach on foot.", span: "md:col-span-5", ratio: "aspect-[4/3]" },
            { photo: PHOTOS.listen, k: "Listen", q: "That plain-looking tower? A hundred years ago it was a laboratory.", span: "md:col-span-5", ratio: "aspect-[4/3]" },
          ].map((c) => (
            <figure key={c.k} className={`relative overflow-hidden rounded-[20px] ${c.span} ${c.ratio}`} style={{ minHeight: 260 }}>
              <Photo photo={c.photo} className="absolute inset-0 transition-transform duration-700 hover:scale-[1.03]" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(31,29,26,0) 40%, rgba(31,29,26,0.8) 100%)" }} />
              <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="font-semibold tracking-[-0.02em] text-[30px] leading-none">{c.k}</div>
                <p className="mt-2 max-w-[420px] text-[15px] leading-6 text-white/90">&ldquo;{c.q}&rdquo;</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 两位导游 */}
      <section id="guides" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: T.gold }}>
          Your guides
        </p>
        <h2 className="mt-3 font-semibold tracking-[-0.02em] text-[36px] leading-[1.08] md:text-[56px]">Two voices. Pick the one you&rsquo;d walk with.</h2>
        <div className="mt-10">
          <GuideCompare appUrl={appUrl} speech={speech} />
        </div>
        <p className="mt-6 text-[14px]" style={{ color: T.muted }}>
          Both speak English, 中文, Español, Français, Deutsch, 日本語, 한국어 and Português.
        </p>
      </section>

      {/* 傍晚场景：暗色一屏 */}
      <section className="relative overflow-hidden" style={{ minHeight: 520 }}>
        <Photo photo={PHOTOS.alley} className="absolute inset-0" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(31,29,26,0.85) 0%, rgba(31,29,26,0.35) 60%, rgba(31,29,26,0.1) 100%)" }} />
        <div className="relative mx-auto flex max-w-[1200px] flex-col justify-center px-5 py-24 text-white md:px-8" style={{ minHeight: 520 }}>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: "#F2C98A" }}>
            With you the whole way
          </p>
          <h2 className="mt-3 max-w-[640px] font-semibold tracking-[-0.02em] text-[36px] leading-[1.08] md:text-[56px]">
            &ldquo;Facing the church, take the steps on the right. Halfway up, turn around. That&rsquo;s the view they put on the postcards.&rdquo;
          </h2>
          <p className="mt-6 text-[15px] text-white/80">Milo, somewhere in Naples · example line</p>
        </div>
      </section>

      {/* 免费与 Plus */}
      <section id="plus" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: T.gold }}>
          Free and Plus
        </p>
        <h2 className="mt-3 font-semibold tracking-[-0.02em] text-[36px] leading-[1.08] md:text-[56px]">Listening and short walks are free. Plus keeps your longer days.</h2>
        <div className="mt-10 grid max-w-[900px] gap-6 md:grid-cols-2">
          <div className="rounded-[20px] border p-8" style={{ borderColor: T.line, background: "#fff" }}>
            <div className="font-semibold tracking-[-0.02em] text-[32px]">Free</div>
            <div className="text-[14px]" style={{ color: T.muted }}>
              No account needed
            </div>
            <ul className="mt-6 flex flex-col gap-2.5 text-[15px] leading-6">
              {["Places around you, anywhere", "A guided story for any place", "Ask your guide anything", "One-hour walking routes", "Half-day and full-day routes (basic version, during beta)", "Translate signs and menus", "Favorites and offline reading"].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: T.accent }} />
                  {x}
                </li>
              ))}
            </ul>
            <a href={appUrl} className={`${btnGhost} mt-8`} style={{ borderColor: T.line, color: T.ink }}>
              Open in browser
            </a>
          </div>
          <div className="relative rounded-[20px] border-2 p-8" style={{ borderColor: T.ink, background: "#fff" }}>
            <span className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white" style={{ background: T.accent }}>
              Coming soon
            </span>
            <div className="font-semibold tracking-[-0.02em] text-[32px]">Plus</div>
            <div className="text-[14px]" style={{ color: T.muted }}>
              Price to be announced
            </div>
            <ul className="mt-6 flex flex-col gap-2.5 text-[15px] leading-6">
              <li className="font-bold">Everything in Free, plus</li>
              {["Save, adjust and pick up your routes across days", "Traveler views: what visitors really thought", "Themed walks", "Travel journal"].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: T.accent }} />
                  {x}
                </li>
              ))}
            </ul>
            {notify === "done" ? (
              <p className="mt-8 text-[15px] font-semibold" style={{ color: T.teal }}>
                You&rsquo;re on the list. We&rsquo;ll write when Plus opens.
              </p>
            ) : (
              <form onSubmit={submitEmail} className="mt-8 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-12 min-w-0 flex-1 rounded-full border px-5 text-[15px] outline-none"
                  style={{ borderColor: T.line }}
                />
                <button type="submit" className={btnPrimary} style={{ background: T.ink }} disabled={notify === "sending"}>
                  {notify === "sending" ? "Sending…" : "Get notified"}
                </button>
              </form>
            )}
            {notify === "error" && (
              <p className="mt-2 text-[13px]" style={{ color: T.accent }}>
                Couldn&rsquo;t save that. Try again in a moment.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 下载 */}
      <section id="download" className="mx-auto max-w-[1200px] px-5 pb-20 md:px-8">
        <div className="flex flex-col gap-6 rounded-[20px] p-8 md:flex-row md:items-center md:justify-between md:p-12" style={{ background: T.ink, color: T.bg }}>
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-[34px] leading-[1.08] md:text-[44px]">Works in your browser today.</h2>
            <p className="mt-3 max-w-[520px] text-[15px] leading-6 text-white/75">
              No install needed. Add it to your home screen for the app feel. The Android beta is a direct download: it needs an internet connection and loads the same app, so it updates with the website.
            </p>
            {apkUrl && (
              <p className="mt-2 text-[13px] text-white/60">
                Android {apkVersion ? `version ${apkVersion}` : "beta"} · APK file, allow installs from your browser when asked · Android 7.0 or newer
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={appUrl} className={btnPrimary} style={{ background: T.accent }}>
              Try your local guide
            </a>
            {apkUrl ? (
              <a href={apkUrl} className={btnGhost} style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }} download>
                Download Android beta
              </a>
            ) : (
              <span className={btnGhost} style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)" }}>
                Android beta · coming soon
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t" style={{ borderColor: T.line }}>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-10 text-[13px] md:flex-row md:justify-between md:px-8" style={{ color: T.muted }}>
          <div className="max-w-[420px]">
            <div className="text-[15px] font-bold" style={{ color: T.ink }}>
              ReAround You
            </div>
            <p className="mt-2 leading-5">
              Place data from OpenStreetMap, Wikipedia, Wikivoyage, Wikidata and the UNESCO World Heritage List. Stories are AI-generated from those sources; check anything that matters.
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
              . Other street scenes and the two guide portraits are AI-generated brand images of fictional places and characters.
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
