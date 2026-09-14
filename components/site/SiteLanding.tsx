"use client";

import { useEffect, useRef, useState } from "react";
import { PHOTOS, type SitePhoto } from "@/lib/site/photos";
import { PERSONA, type PersonaId } from "@/lib/personas";

/* ------------------------------------------------------------------ */
/* 官网：暖阳配色（暖白 / 墨 / 陶土橙 / 芥末黄），照片打底，情境按钮直接演一段对话。 */
/* ------------------------------------------------------------------ */

const T = {
  bg: "#FBF6EE",
  ink: "#1F1D1A",
  accent: "#D9633A",
  gold: "#C9891C",
  teal: "#2F5D62",
  muted: "#6B645A",
  line: "#E4D9C8",
  paper: "#F3ECDF",
} as const;

type Situation = { key: string; label: string; user: string; guide: string; city: string; persona: PersonaId };

const SITUATIONS: Situation[] = [
  {
    key: "wander",
    label: "Just wander for an hour",
    user: "I've got an hour. Just wander?",
    guide: "Then let's not look at a map. Turn left at the blue tiles and keep the river on your right. I'll tell you what you're passing as we go.",
    city: "Lisbon · Alfama",
    persona: "mia",
  },
  {
    key: "eat",
    label: "Find somewhere locals eat",
    user: "Somewhere locals actually eat?",
    guide: "Skip the one with the queue. Two streets back there's a tasca with six tables and a handwritten menu. Ask for whatever the grandmother is cooking today.",
    city: "Porto · Ribeira",
    persona: "milo",
  },
  {
    key: "story",
    label: "Hear the story behind this street",
    user: "What's the story of this street?",
    guide: "This was the edge of the old Moorish quarter. See the doorway with the carved knot above it? That's older than the country you're standing in.",
    city: "Seville · Santa Cruz",
    persona: "mia",
  },
  {
    key: "quiet",
    label: "Avoid the crowds",
    user: "Too many people here. Somewhere quieter?",
    guide: "Good call, the terrace is packed right now. There's a smaller one three minutes up the stairs to your left. Same view, no elbows.",
    city: "Naples · Centro Storico",
    persona: "milo",
  },
];

/** 打字机：一段文字逐字出现，配合头像旁的小声波 */
function useTypewriter(text: string, speed = 16) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);
  return { shown, done: shown.length >= text.length };
}

/** 数字进入视口时从 0 跳到目标值 */
function Counter({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 900;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref}>
      <div className="font-serif text-[34px] leading-none md:text-[40px]" style={{ color: T.gold }}>
        {n}
        {suffix}
      </div>
      <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.muted }}>
        {label}
      </div>
    </div>
  );
}

function Avatar({ id, size = 28 }: { id: PersonaId; size?: number }) {
  const p = PERSONA[id];
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-serif font-bold"
      style={{ width: size, height: size, background: id === "mia" ? T.accent : T.teal, color: T.bg, fontSize: Math.round(size * 0.5) }}
    >
      {p.name[0]}
    </span>
  );
}

function Wave({ active }: { active: boolean }) {
  return (
    <span className="ml-1 inline-flex items-end gap-[2px] align-baseline" aria-hidden>
      {[5, 9, 4, 8, 5].map((h, i) => (
        <i
          key={i}
          className="inline-block w-[2px] rounded-sm"
          style={{
            height: h,
            background: T.accent,
            transformOrigin: "bottom",
            animation: active ? `rr-wave 0.8s ${i * 0.1}s ease-in-out infinite alternate` : "none",
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </span>
  );
}

function Photo({ photo, className = "", style }: { photo: SitePhoto; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.src} alt={photo.alt} loading="lazy" className={`h-full w-full object-cover ${className}`} style={style} />;
}

/* ------------------------------------------------------------------ */

export function SiteLanding({ appUrl }: { appUrl: string }) {
  const [sit, setSit] = useState<Situation>(SITUATIONS[0]);
  const { shown, done } = useTypewriter(sit.guide);
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [speaking, setSpeaking] = useState<PersonaId | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /** 试听：直接调应用的 TTS，读一句人物介绍 */
  async function hear(id: PersonaId) {
    const line = id === "mia" ? "Hi, I'm Mia. Let's take the quiet street, there's a doorway I want to show you." : "Hey, I'm Milo. Skip the queue, the good part is around the corner.";
    audioRef.current?.pause();
    setSpeaking(id);
    try {
      const a = new Audio(`${appUrl.replace(/\/$/, "")}/api/tts?lang=en&voice=${PERSONA[id].gender}&text=${encodeURIComponent(line)}`);
      audioRef.current = a;
      a.onended = () => setSpeaking(null);
      a.onerror = () => setSpeaking(null);
      await a.play();
    } catch {
      setSpeaking(null);
    }
  }

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
        @keyframes rr-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .rr-up { animation: rr-up 0.7s ease-out both; }
      `}</style>

      {/* 顶栏 */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 md:px-8">
          <a href="#top" className="flex items-center gap-2.5 text-[15px] font-bold text-white">
            <span className="relative inline-block h-5 w-5 rounded-full bg-white">
              <span className="absolute left-[5px] top-[5px] h-[10px] w-[10px] rounded-full" style={{ background: T.accent }} />
            </span>
            ReAround You
          </a>
          <nav className="hidden items-center gap-7 text-[13px] font-semibold text-white/85 md:flex">
            <a href="#how">How it works</a>
            <a href="#guides">Guides</a>
            <a href="#plus">Plus</a>
            <a href={appUrl} className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-bold" style={{ color: T.ink }}>
              Open the app
            </a>
          </nav>
          <a href={appUrl} className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-bold md:hidden" style={{ color: T.ink }}>
            Open
          </a>
        </div>
      </header>

      {/* 首屏：满幅照片 + 左下文字 + 情境按钮 + 右侧手机演示 */}
      <section id="top" className="relative min-h-[100svh] overflow-hidden">
        <Photo photo={PHOTOS.hero} className="absolute inset-0" style={{ objectPosition: "50% 45%" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(31,29,26,0.35) 0%, rgba(31,29,26,0.05) 35%, rgba(31,29,26,0.75) 100%)" }} />
        <div className="relative mx-auto flex min-h-[100svh] max-w-[1200px] flex-col justify-end gap-8 px-5 pb-10 pt-28 md:flex-row md:items-end md:justify-between md:px-8 md:pb-16">
          <div className="max-w-[620px] text-white rr-up">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: "#F2C98A" }}>
              Your AI local guide
            </p>
            <h1 className="mt-3 font-serif text-[44px] leading-[0.98] md:text-[76px]">
              You&rsquo;re already here.
              <br />
              Now let&rsquo;s look around.
            </h1>
            <p className="mt-5 max-w-[460px] text-[16px] leading-7 text-white/85 md:text-[18px]">
              A local friend in your pocket who knows every street. Tell them what you feel like, and start walking.
            </p>

            <p className="mt-7 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "#F2C98A" }}>
              Right now I want to…
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {SITUATIONS.map((s) => {
                const on = s.key === sit.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSit(s)}
                    aria-pressed={on}
                    className="h-10 rounded-full px-4 text-[13px] font-semibold backdrop-blur transition-colors"
                    style={on ? { background: T.accent, color: "#fff" } : { background: "rgba(255,255,255,0.9)", color: T.ink }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href={appUrl} className={btnPrimary} style={{ background: T.accent }}>
                Open in browser
              </a>
              <a href="#download" className="text-[14px] font-semibold text-white/85 underline-offset-4 hover:underline">
                Get it on Android
              </a>
            </div>
          </div>

          {/* 手机演示 */}
          <div className="mx-auto w-[280px] shrink-0 md:mx-0 md:w-[300px] rr-up" style={{ animationDelay: "0.15s" }}>
            <div className="overflow-hidden rounded-[34px] border-[6px] shadow-[0_30px_80px_rgba(0,0,0,0.45)]" style={{ borderColor: T.ink, background: T.bg }}>
              <div className="flex flex-col gap-3 px-4 pb-5 pt-9" style={{ minHeight: 400 }}>
                <div className="flex items-center gap-2">
                  <Avatar id={sit.persona} size={26} />
                  <span className="font-serif text-[18px]">{PERSONA[sit.persona].name}</span>
                  <span className="text-[11px]" style={{ color: T.muted }}>
                    · {sit.city}
                  </span>
                </div>
                <div className="self-end max-w-[85%] rounded-[16px] rounded-br-[6px] px-3.5 py-2 text-[13px] leading-5 text-white" style={{ background: T.ink }}>
                  {sit.user}
                </div>
                <div className="flex items-end gap-2">
                  <Avatar id={sit.persona} size={24} />
                  <div className="min-h-[44px] max-w-[88%] rounded-[16px] rounded-bl-[6px] px-3.5 py-2.5 text-[13px] leading-5" style={{ background: T.paper, color: "#2E2A25" }}>
                    {shown}
                    <Wave active={!done} />
                  </div>
                </div>
                <div className="mt-auto flex h-10 items-center rounded-full border px-4 text-[12px]" style={{ borderColor: T.line, color: T.muted, background: "#fff" }}>
                  Ask {PERSONA[sit.persona].name} anything…
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 数字 */}
      <section className="mx-auto grid max-w-[1200px] grid-cols-3 gap-6 px-5 py-12 md:px-8 md:py-16">
        <Counter value={190} suffix="+" label="countries" />
        <Counter value={8} label="guide languages" />
        <Counter value={3} suffix=" s" label="to start talking" />
      </section>

      {/* 怎么用：三步 */}
      <section id="how" className="mx-auto max-w-[1200px] px-5 pb-6 md:px-8 md:pb-10">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: T.gold }}>
          How it works
        </p>
        <h2 className="mt-3 max-w-[700px] font-serif text-[36px] leading-[1.02] md:text-[56px]">Three seconds from &ldquo;what&rsquo;s that?&rdquo; to knowing.</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            { n: "1", t: "Open the map", d: "Everything worth a look within a kilometre, from world heritage to the odd little chapel nobody photographs." },
            { n: "2", t: "Tap what you see", d: "Or point the camera at it. Your guide recognises the place and picks up where the plaque leaves off." },
            { n: "3", t: "Listen and ask", d: "A minute of story in your language, then keep talking. Why the street bends. Where to eat after." },
          ].map((s) => (
            <li key={s.n} className="rounded-[24px] p-7" style={{ background: T.paper }}>
              <div className="font-serif text-[40px] leading-none" style={{ color: T.accent }}>
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px]">
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
            <h2 className="mt-3 font-serif text-[36px] leading-[1.02] md:text-[52px]">Tell it where you are and how long you have.</h2>
            <div className="mt-8 flex flex-col gap-3">
              <div className="self-end max-w-[85%] rounded-[18px] rounded-br-[6px] px-4 py-2.5 text-[15px] leading-6 text-white" style={{ background: T.ink }}>
                I&rsquo;m by the cathedral, two hours to spare.
              </div>
              <div className="flex items-end gap-2">
                <Avatar id="mia" size={30} />
                <div className="max-w-[90%] rounded-[18px] rounded-bl-[6px] px-4 py-3 text-[15px] leading-6" style={{ background: T.paper, color: "#2E2A25" }}>
                  Let&rsquo;s skip the queue then. Six minutes north there&rsquo;s a tiled courtyard almost nobody finds. From there I&rsquo;ll take you through three quiet streets and drop you
                  back by the river at sunset.
                </div>
              </div>
              <a href={appUrl} className="ml-10 mt-1 text-[15px] font-bold" style={{ color: T.accent }}>
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
        <h2 className="mt-3 max-w-[760px] font-serif text-[36px] leading-[1.02] md:text-[56px]">It knows where the good coffee is, and which alley to take instead.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-12">
          {[
            { photo: PHOTOS.eat, k: "Eat", q: "The place with the queue is fine. The one next to it is better.", span: "md:col-span-7 md:row-span-2", ratio: "aspect-[4/3] md:aspect-auto md:h-full" },
            { photo: PHOTOS.walk, k: "Walk", q: "If you like it quiet, we go in through the other lane.", span: "md:col-span-5", ratio: "aspect-[4/3]" },
            { photo: PHOTOS.listen, k: "Listen", q: "That plain-looking tower? A hundred years ago it was a laboratory.", span: "md:col-span-5", ratio: "aspect-[4/3]" },
          ].map((c) => (
            <figure key={c.k} className={`relative overflow-hidden rounded-[28px] ${c.span} ${c.ratio}`} style={{ minHeight: 260 }}>
              <Photo photo={c.photo} className="absolute inset-0 transition-transform duration-700 hover:scale-[1.03]" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(31,29,26,0) 40%, rgba(31,29,26,0.8) 100%)" }} />
              <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="font-serif text-[30px] leading-none">{c.k}</div>
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
        <h2 className="mt-3 font-serif text-[36px] leading-[1.02] md:text-[56px]">Two voices. Pick the one you&rsquo;d walk with.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {(["mia", "milo"] as PersonaId[]).map((id) => {
            const p = PERSONA[id];
            const color = id === "mia" ? T.accent : T.teal;
            return (
              <div key={id} className="flex flex-col gap-6 rounded-[28px] p-7 md:flex-row md:items-center md:p-9" style={{ background: T.paper }}>
                <div className="flex h-[150px] w-[150px] shrink-0 items-center justify-center rounded-[28px] font-serif text-[84px] text-white" style={{ background: color }}>
                  {p.name[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-[40px] leading-none">{p.name}</h3>
                  <p className="mt-3 text-[16px] leading-7" style={{ color: T.muted }}>
                    {p.tagline.en}
                  </p>
                  <button
                    type="button"
                    onClick={() => void hear(id)}
                    className={`${btnGhost} mt-5 gap-2`}
                    style={{ borderColor: T.line, color: T.ink, background: "#fff" }}
                  >
                    <span className="inline-block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent" style={{ borderLeftColor: color }} />
                    {speaking === id ? "Speaking…" : `Hear ${p.name}`}
                  </button>
                </div>
              </div>
            );
          })}
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
          <h2 className="mt-3 max-w-[640px] font-serif text-[36px] leading-[1.02] md:text-[56px]">
            &ldquo;Take the steps on your left. Halfway up, look back. That&rsquo;s the view they put on the postcards, minus the crowd.&rdquo;
          </h2>
          <p className="mt-6 text-[15px] text-white/80">Milo, somewhere in Naples</p>
        </div>
      </section>

      {/* 免费与 Plus */}
      <section id="plus" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: T.gold }}>
          Free and Plus
        </p>
        <h2 className="mt-3 font-serif text-[36px] leading-[1.02] md:text-[56px]">Listening is free. Plus plans your day.</h2>
        <div className="mt-10 grid max-w-[900px] gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border p-8" style={{ borderColor: T.line, background: "#fff" }}>
            <div className="font-serif text-[32px]">Free</div>
            <div className="text-[14px]" style={{ color: T.muted }}>
              Forever
            </div>
            <ul className="mt-6 flex flex-col gap-2.5 text-[15px] leading-6">
              {["Places around you, anywhere", "A guided story for any place", "Ask your guide anything", "Translate signs and menus", "Favorites and offline reading"].map((x) => (
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
          <div className="relative rounded-[28px] border-2 p-8" style={{ borderColor: T.ink, background: "#fff" }}>
            <span className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white" style={{ background: T.accent }}>
              Coming soon
            </span>
            <div className="font-serif text-[32px]">Plus</div>
            <div className="text-[14px]" style={{ color: T.muted }}>
              Price to be announced
            </div>
            <ul className="mt-6 flex flex-col gap-2.5 text-[15px] leading-6">
              <li className="font-bold">Everything in Free, plus</li>
              {["Plan my day: a walking route by time and interest", "Traveler views: what visitors really thought", "Themed walks", "Travel journal"].map((x) => (
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
        <div className="flex flex-col gap-6 rounded-[28px] p-8 md:flex-row md:items-center md:justify-between md:p-12" style={{ background: T.ink, color: T.bg }}>
          <div>
            <h2 className="font-serif text-[34px] leading-[1.02] md:text-[44px]">Works in your browser today.</h2>
            <p className="mt-3 max-w-[520px] text-[15px] leading-6 text-white/75">
              No install needed. Add it to your home screen for the app feel. The Android app is on its way.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={appUrl} className={btnPrimary} style={{ background: T.accent }}>
              Open in browser
            </a>
            <span className={btnGhost} style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)" }}>
              Android · coming soon
            </span>
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
              Photos:{" "}
              {Object.values(PHOTOS).map((p, i, arr) => (
                <span key={p.page}>
                  <a href={p.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    {p.author}
                  </a>{" "}
                  ({p.license}){i < arr.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a href="#" className="font-semibold" style={{ color: T.ink }}>
              Privacy
            </a>
            <a href="#" className="font-semibold" style={{ color: T.ink }}>
              Terms
            </a>
            <a href="mailto:hello@example.com" className="font-semibold" style={{ color: T.ink }}>
              hello@example.com
            </a>
            <span>© {new Date().getFullYear()} ReAround You · Company name to follow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
