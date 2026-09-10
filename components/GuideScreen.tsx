"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { t, type GuideLang, type Lang, type MessageKey } from "@/lib/i18n";
import { homeHref, talkHref } from "@/lib/links";
import { formatDistance } from "@/lib/geo";
import { DEFAULT_PERSONA, PERSONA, type PersonaId } from "@/lib/personas";
import { getPersona, readCoords, resolveGuideLang } from "@/lib/prefs";
import type { Budget, Interest, RoutePlan, RouteStop } from "@/lib/route";
import { saveRoute } from "@/lib/routeStore";
import { useLanguage } from "@/components/LanguageProvider";
import { PersonaAvatar } from "@/components/PersonaPicker";
import { PhotoIdentify } from "@/components/PhotoIdentify";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/TabBar";
import { BusIcon, CloseIcon, HeadphonesIcon, MapIcon, NotebookIcon, QuoteIcon, RefreshIcon, RouteIcon, SparkIcon, TranslateIcon, WalkIcon } from "@/components/Icons";

type Coords = { lat: number; lon: number };

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; kind: "text"; text: string; streaming?: boolean }
  | { id: number; role: "assistant"; kind: "time" }
  | { id: number; role: "assistant"; kind: "interests" }
  | { id: number; role: "assistant"; kind: "planning" }
  | { id: number; role: "assistant"; kind: "plan"; plan: RoutePlan };

const BUDGET_LABEL: Record<Budget, MessageKey> = { "1h": "budget1h", half: "budgetHalf", day: "budgetDay" };
const INTEREST_LABEL: Record<Interest, MessageKey> = {
  history: "interestHistory",
  art: "interestArt",
  food: "interestFood",
  nature: "interestNature",
  kids: "interestKids",
  any: "interestAny",
};

/** 分钟数变成「2 小时 15 分钟」 */
export function formatMinutes(lang: Lang, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return t(lang, "minutes", { m });
  if (m === 0) return t(lang, "hours", { h });
  return t(lang, "hoursMinutes", { h, m });
}

let nextId = 1;
const mk = () => nextId++;

/** 对话存本机，切 tab、刷新都还在；一天没动就重新开始 */
const CHAT_KEY = "tourguide.guideChat";
const CHAT_TTL = 24 * 60 * 60 * 1000;
interface SavedChat {
  lang: Lang;
  savedAt: number;
  messages: Msg[];
  budget: Budget | null;
  interests: Interest[];
}
function loadChat(lang: Lang): SavedChat | null {
  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as SavedChat;
    if (c.lang !== lang || Date.now() - c.savedAt > CHAT_TTL || !Array.isArray(c.messages) || c.messages.length < 2) return null;
    return c;
  } catch {
    return null;
  }
}
function saveChat(c: SavedChat | null): void {
  try {
    if (c) window.localStorage.setItem(CHAT_KEY, JSON.stringify(c));
    else window.localStorage.removeItem(CHAT_KEY);
  } catch {
    /* 隐私模式 */
  }
}

/**
 * 「导游」tab：AI 中心。一个聊天界面，快捷卡片（规划今天、拍照翻译、两个付费占位）加输入框。
 * 规划流程全靠按钮，不用打字；结果是几张停靠点卡片，可以一键送到地图上。
 */
export function GuideScreen({ llmReady }: { llmReady: boolean }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaId>(DEFAULT_PERSONA);
  const [guideLang, setGuideLang] = useState<GuideLang>(lang);
  const [center, setCenter] = useState<Coords | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 偏好和位置只能在浏览器读
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPersona(getPersona());
    setGuideLang(resolveGuideLang(lang));
    const c = readCoords("center") ?? readCoords("myLocation");
    setCenter(c);
    const saved = loadChat(lang);
    if (saved) {
      nextId = Math.max(nextId, ...saved.messages.map((m) => m.id + 1));
      setMessages(saved.messages);
      setBudget(saved.budget);
      setInterests(saved.interests);
    } else {
      setMessages([{ id: mk(), role: "assistant", kind: "text", text: t(lang, c ? "guideHello" : "guideNoLocation") }]);
    }
    setReady(true);
  }, [lang]);

  // 每次消息变化就存一份（正在生成中的、正在排路线的不存）
  useEffect(() => {
    if (!ready) return;
    const done = messages.filter((m) => !(m.role === "assistant" && (m.kind === "planning" || (m.kind === "text" && m.streaming))));
    if (done.length < 2) return;
    saveChat({ lang, savedAt: Date.now(), messages: done, budget, interests });
  }, [messages, budget, interests, lang, ready]);

  function resetChat() {
    abortRef.current?.abort();
    saveChat(null);
    setBudget(null);
    setInterests([]);
    setMessages([{ id: mk(), role: "assistant", kind: "text", text: t(lang, center ? "guideHello" : "guideNoLocation") }]);
  }

  useEffect(() => {
    if (!center) return;
    const ctrl = new AbortController();
    fetch(`/api/geocode?lat=${center.lat}&lon=${center.lon}&lang=${lang}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { name?: string | null }) => setAreaName(d.name ?? null))
      .catch(() => {});
    return () => ctrl.abort();
  }, [center, lang]);

  // 有新消息就滚到底
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, interests]);

  type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, "id"> : never) : never;
  const push = (m: NewMsg) => setMessages((prev) => [...prev, { ...m, id: mk() } as Msg]);
  const fresh = messages.length <= 1;

  /* ---------- 规划 ---------- */
  function startPlan() {
    if (!center) {
      push({ role: "assistant", kind: "text", text: t(lang, "guideNoLocation") });
      return;
    }
    setBudget(null);
    setInterests([]);
    push({ role: "user", text: t(lang, "planToday") });
    push({ role: "assistant", kind: "time" });
  }

  function chooseBudget(b: Budget) {
    setBudget(b);
    push({ role: "user", text: t(lang, BUDGET_LABEL[b]) });
    push({ role: "assistant", kind: "interests" });
  }

  function toggleInterest(i: Interest) {
    setInterests((prev) => {
      if (i === "any") return prev.includes("any") ? [] : ["any"];
      const without = prev.filter((x) => x !== "any");
      return without.includes(i) ? without.filter((x) => x !== i) : [...without, i];
    });
  }

  async function makeRoute(b: Budget, ints: Interest[], announce = true) {
    if (!center || busy) return;
    const chosen = ints.length ? ints : ["any" as Interest];
    if (announce) push({ role: "user", text: chosen.map((i) => t(lang, INTEREST_LABEL[i])).join(" · ") });
    const planningId = mk();
    setMessages((prev) => [...prev, { id: planningId, role: "assistant", kind: "planning" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: center.lat, lon: center.lon, budget: b, interests: chosen, lang: guideLang, dataLang: lang, persona, areaName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const plan = (await res.json()) as RoutePlan;
      setMessages((prev) => prev.map((m) => (m.id === planningId ? { id: planningId, role: "assistant", kind: "plan", plan } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === planningId ? { id: planningId, role: "assistant", kind: "text", text: t(lang, "planFailed") } : m)));
    } finally {
      setBusy(false);
    }
  }

  function showOnMap(plan: RoutePlan) {
    saveRoute(plan);
    router.push(`${homeHref(plan.origin.lat, plan.origin.lon)}&route=1`);
  }

  /* ---------- 随手问 ---------- */
  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setQuestion("");
    push({ role: "user", text: q });
    const history = [...messages, { id: 0, role: "user" as const, text: q }]
      .filter((m): m is Extract<Msg, { text: string }> => "text" in m && typeof m.text === "string" && !(m.role === "assistant" && m.streaming))
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.text }));
    const replyId = mk();
    setMessages((prev) => [...prev, { id: replyId, role: "assistant", kind: "text", text: "", streaming: true }]);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ lat: center?.lat, lon: center?.lon, lang: guideLang, dataLang: lang, persona, areaName, messages: history }),
      });
      if (!res.ok || !res.body) {
        const key: MessageKey = res.status === 429 ? "guideBusy" : "guideError";
        setMessages((prev) => prev.map((m) => (m.id === replyId ? { id: replyId, role: "assistant", kind: "text", text: t(lang, key) } : m)));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((prev) => prev.map((m) => (m.id === replyId ? { id: replyId, role: "assistant", kind: "text", text: snapshot, streaming: true } : m)));
      }
      setMessages((prev) => prev.map((m) => (m.id === replyId ? { id: replyId, role: "assistant", kind: "text", text: acc } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === replyId ? { id: replyId, role: "assistant", kind: "text", text: t(lang, "guideError") } : m)));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  /** 付费占位：导游用一句话说明这个功能将来做什么，并告知尚未开放 */
  function paid(feature: MessageKey, pitch: MessageKey) {
    push({ role: "user", text: t(lang, feature) });
    push({ role: "assistant", kind: "text", text: t(lang, pitch) });
  }

  /* ---------- 渲染 ---------- */
  const p = PERSONA[persona];
  const lastId = messages[messages.length - 1]?.id;
  // 底部悬浮的东西（输入框，聊起来后还有一行快捷胶囊）会盖住最后几条消息，正文要留出同样高度
  const overlayPx = TAB_BAR_HEIGHT + (fresh ? 84 : 140);

  const cards = (openTranslate: () => void) => [
    { key: "plan", icon: <RouteIcon size={20} />, title: t(lang, "planToday"), hint: t(lang, "planTodayHint"), onClick: startPlan },
    { key: "translate", icon: <TranslateIcon size={20} />, title: t(lang, "photoTranslate"), hint: t(lang, "photoTranslateHint"), onClick: openTranslate },
    { key: "views", icon: <QuoteIcon size={20} />, title: t(lang, "travelerViews"), hint: t(lang, "travelerViewsHint"), paid: true, onClick: () => paid("travelerViews", "travelerViewsPitch") },
    { key: "walk", icon: <WalkIcon size={20} />, title: t(lang, "themedWalk"), hint: t(lang, "themedWalkHint"), paid: true, onClick: () => paid("themedWalk", "themedWalkPitch") },
    { key: "journal", icon: <NotebookIcon size={20} />, title: t(lang, "travelJournal"), hint: t(lang, "travelJournalHint"), paid: true, onClick: () => paid("travelJournal", "travelJournalPitch") },
  ];

  return (
    <>
      <main className="mx-auto flex w-full max-w-[520px] flex-col px-4 pt-12" style={{ paddingBottom: `calc(${overlayPx}px + env(safe-area-inset-bottom))` }}>
        {/* 头部：导游头像、名字、所在区域 */}
        <div className="flex items-center gap-3 px-1">
          <PersonaAvatar id={persona} size={44} />
          <div className="min-w-0">
            <h1 className="font-serif text-[28px] leading-8">{ready ? p.name : ""}</h1>
            <p className="truncate text-[12px] text-muted">
              {t(lang, "yourGuide")}
              {areaName ? ` · ${areaName}` : ""}
            </p>
          </div>
          {!fresh && (
            <button
              type="button"
              onClick={resetChat}
              aria-label={t(lang, "newChat")}
              title={t(lang, "newChat")}
              className="ml-auto flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[12px] font-semibold text-muted"
            >
              <CloseIcon size={14} />
              {t(lang, "newChat")}
            </button>
          )}
        </div>

        {!llmReady && <p className="mt-6 rounded-[16px] bg-surface-2 px-4 py-3 text-[14px] text-muted">{t(lang, "guideError")}</p>}

        {/* 对话 */}
        <div className="mt-5 flex flex-col gap-3">
          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[86%] whitespace-pre-wrap rounded-[18px] rounded-br-[6px] bg-ink px-4 py-2.5 text-[15px] leading-6 text-bg">{m.text}</p>
                </div>
              );
            }
            const isLast = m.id === lastId;
            return (
              <div key={m.id} className="flex items-end gap-2">
                <PersonaAvatar id={persona} size={28} />
                <div className="min-w-0 max-w-[86%] flex-1">
                  {m.kind === "text" && (
                    <p className="whitespace-pre-wrap rounded-[18px] rounded-bl-[6px] bg-surface-2 px-4 py-3 text-[15px] leading-7 text-ink-soft">
                      {m.text || (m.streaming ? t(lang, "guideThinking") : "")}
                      {m.streaming && m.text && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent align-baseline" />}
                    </p>
                  )}
                  {m.kind === "time" && (
                    <div className="flex flex-col gap-2">
                      <p className="rounded-[18px] rounded-bl-[6px] bg-surface-2 px-4 py-3 text-[15px] leading-7 text-ink-soft">{t(lang, "planAskTime")}</p>
                      {isLast && (
                        <div className="flex flex-wrap gap-2 pl-1">
                          {(["1h", "half", "day"] as Budget[]).map((b) => (
                            <Chip key={b} label={t(lang, BUDGET_LABEL[b])} active={budget === b} onClick={() => chooseBudget(b)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {m.kind === "interests" && (
                    <div className="flex flex-col gap-2">
                      <p className="rounded-[18px] rounded-bl-[6px] bg-surface-2 px-4 py-3 text-[15px] leading-7 text-ink-soft">{t(lang, "planAskInterests")}</p>
                      {isLast && (
                        <>
                          <div className="flex flex-wrap gap-2 pl-1">
                            {(Object.keys(INTEREST_LABEL) as Interest[]).map((i) => (
                              <Chip key={i} label={t(lang, INTEREST_LABEL[i])} active={interests.includes(i)} onClick={() => toggleInterest(i)} />
                            ))}
                          </div>
                          <p className="pl-1 text-[12px] text-faint">{t(lang, "planFromHere")}</p>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => budget && void makeRoute(budget, interests)}
                            className="mt-1 flex h-12 items-center justify-center gap-2 rounded-[16px] bg-ink text-[15px] font-bold text-bg disabled:opacity-50"
                          >
                            <SparkIcon size={16} />
                            {t(lang, "makeRoute")}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {m.kind === "planning" && (
                    <p className="flex items-center gap-2 rounded-[18px] rounded-bl-[6px] bg-surface-2 px-4 py-3 text-[15px] text-muted">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
                      {t(lang, "planning")}
                    </p>
                  )}
                  {m.kind === "plan" && (
                    <PlanMessage
                      plan={m.plan}
                      lang={lang}
                      onShow={() => showOnMap(m.plan)}
                      onRetry={isLast && !busy ? () => void makeRoute(m.plan.budget, m.plan.interests, false) : undefined}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} style={{ scrollMarginBottom: `calc(${overlayPx}px + env(safe-area-inset-bottom))` }} />
        </div>

        {/* 快捷卡片：刚进来是大卡片，聊起来后收成一行小胶囊（在输入框上方） */}
        <PhotoIdentify
          lang={lang}
          guideLang={guideLang}
          candidates={[]}
          defaultMode="translate"
          onSearchName={() => {}}
          trigger={(open) =>
            fresh ? (
              <div className="mt-4 flex flex-col gap-2">
                {cards(open).map((c) => (
                  <button key={c.key} type="button" onClick={c.onClick} className="flex items-center gap-3 rounded-[16px] border border-line bg-surface px-4 py-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent">{c.icon}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[15px] font-semibold text-ink">{c.title}</span>
                      <span className="truncate text-[12px] text-muted">{c.hint}</span>
                    </span>
                    {c.paid && <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-faint">{t(lang, "paidFeature")}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="fixed inset-x-0 z-[1001] mx-auto max-w-[520px] px-4" style={{ bottom: `calc(${TAB_BAR_HEIGHT + 62}px + env(safe-area-inset-bottom))` }}>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {cards(open).map((c) => (
                    <button key={c.key} type="button" onClick={c.onClick} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface/95 px-3 text-[12px] font-semibold text-ink backdrop-blur">
                      <span className="text-accent">{c.icon}</span>
                      {c.title}
                      {c.paid && <span className="text-[10px] font-semibold text-faint">· {t(lang, "paidFeature")}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          }
        />
      </main>

      {/* 输入框：固定在 tab 栏上方 */}
      <form
        className="fixed inset-x-0 z-[1001] mx-auto max-w-[520px] px-4"
        style={{ bottom: `calc(${TAB_BAR_HEIGHT + 10}px + env(safe-area-inset-bottom))` }}
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <div className="flex h-12 items-center gap-2 rounded-full border border-line bg-surface pl-4 pr-1.5 shadow-[0_6px_16px_rgba(27,31,29,0.10)]">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t(lang, "askAnything")}
            disabled={!llmReady}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
          <button type="submit" disabled={!question.trim() || busy || !llmReady} aria-label={t(lang, "send")} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-bg disabled:opacity-40">
            <SparkIcon size={16} />
          </button>
        </div>
      </form>
      <TabBar lang={lang} />
    </>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-colors ${active ? "bg-ink text-bg" : "border border-line bg-surface text-ink"}`}
    >
      {label}
    </button>
  );
}

/** 路线结果：开场白 + 每站一张卡 + 站间步行时间 + 在地图上看 / 换一条 */
function PlanMessage({ plan, lang, onShow, onRetry }: { plan: RoutePlan; lang: Lang; onShow: () => void; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="rounded-[18px] rounded-bl-[6px] bg-surface-2 px-4 py-3 text-[15px] leading-7 text-ink-soft">
        {plan.intro || t(lang, "planFallback")}
        {plan.fallback && plan.intro ? ` ${t(lang, "planFallback")}` : ""}
      </p>
      <ol className="flex flex-col gap-1.5">
        {plan.stops.map((s, i) => (
          <li key={s.id} className="flex flex-col gap-1.5">
            <Leg stop={s} lang={lang} first={i === 0} />
            <StopCard stop={s} index={i + 1} lang={lang} />
          </li>
        ))}
      </ol>
      <p className="pl-1 text-[12px] text-faint">{t(lang, "routeSummary", { n: plan.stops.length, h: formatMinutes(lang, plan.totalMinutes) })}</p>
      <div className="mt-1 flex gap-2">
        <button type="button" onClick={onShow} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[16px] bg-ink text-[15px] font-bold text-bg">
          <MapIcon size={18} />
          {t(lang, "showOnMap")}
        </button>
        {onRetry && (
          <button type="button" onClick={onRetry} aria-label={t(lang, "anotherRoute")} title={t(lang, "anotherRoute")} className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-line bg-surface text-ink">
            <RefreshIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function Leg({ stop, lang, first }: { stop: RouteStop; lang: Lang; first: boolean }) {
  if (first) return <p className="pl-3 text-[12px] font-semibold text-accent">{t(lang, "startHere")} · {formatDistance(stop.legMeters)}</p>;
  return (
    <p className="flex items-center gap-1 pl-3 text-[12px] font-semibold text-accent">
      {stop.legMode === "walk" ? <WalkIcon size={14} /> : <BusIcon size={14} />}
      {stop.legMode === "walk" ? t(lang, "walkMin", { n: stop.legMinutes }) : t(lang, "transitMin", { n: stop.legMinutes })} · {formatDistance(stop.legMeters)}
    </p>
  );
}

export function StopCard({ stop, index, lang, compact = false }: { stop: RouteStop; index: number; lang: Lang; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-line bg-surface p-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-accent-soft/40">
        {stop.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stop.thumbnail} alt="" className="h-full w-full object-cover" />
        )}
        <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-bg">{index}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{stop.title}</p>
        <p className="truncate text-[12px] text-muted">
          {t(lang, "stopStay", { n: stop.minutes })}
          {stop.unesco ? " · UNESCO" : ""}
        </p>
        {!compact && stop.why && <p className="mt-0.5 line-clamp-2 text-[12px] leading-4 text-ink-soft">{stop.why}</p>}
      </div>
      <Link href={talkHref(lang, stop.id)} aria-label={t(lang, "askGuide")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-bg">
        <HeadphonesIcon size={18} />
      </Link>
    </div>
  );
}
