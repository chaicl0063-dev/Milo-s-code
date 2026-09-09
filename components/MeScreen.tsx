"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { clearAllLocalData, getGuideLangPref, setGuideLangPref, type GuideLangPref } from "@/lib/prefs";
import { useLanguage } from "@/components/LanguageProvider";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/TabBar";

const APP_VERSION = "0.3";
const LANG_LABEL: Record<Lang, string> = { en: "English", zh: "中文" };

/** 「我的」页：语言、讲解语言、安装、数据来源、关于、清缓存 */
export function MeScreen() {
  const { lang, setLang } = useLanguage();
  const router = useRouter();
  const [guidePref, setGuidePref] = useState<GuideLangPref>("auto");
  const [install, setInstall] = useState<"unknown" | "installed" | "button" | "ios" | "android" | "desktop">("unknown");
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuidePref(getGuideLangPref());
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/i.test(ua);
    const decide = () => {
      if (standalone) return "installed" as const;
      if (window.__installPrompt) return "button" as const;
      if (isIos) return "ios" as const;
      if (isAndroid) return "android" as const;
      return "desktop" as const;
    };
    setInstall(decide());
    const onInstallable = () => setInstall("button");
    const onInstalled = () => setInstall("installed");
    window.addEventListener("pwa:installable", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwa:installable", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function chooseGuideLang(v: GuideLangPref) {
    setGuidePref(v);
    setGuideLangPref(v);
  }

  async function doInstall() {
    const prompt = window.__installPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstall("installed");
    window.__installPrompt = undefined;
  }

  async function clearData() {
    await clearAllLocalData();
    setCleared(true);
    window.setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 800);
  }

  const installTip =
    install === "ios" ? t(lang, "iosInstallTip") : install === "android" ? t(lang, "androidInstallTip") : install === "desktop" ? t(lang, "desktopInstallTip") : "";

  return (
    <>
      <main
        className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-6 pt-14"
        style={{ paddingBottom: `calc(${TAB_BAR_HEIGHT + 24}px + env(safe-area-inset-bottom))` }}
      >
        <h1 className="font-serif text-[36px] leading-10">{t(lang, "meTitle")}</h1>

        <Section title={t(lang, "uiLanguage")}>
          <Segmented
            options={LANGS.map((l) => ({ value: l, label: LANG_LABEL[l] }))}
            value={lang}
            onChange={(v) => setLang(v as Lang)}
          />
        </Section>

        <Section title={t(lang, "guideLanguage")}>
          <Segmented
            options={[{ value: "auto", label: t(lang, "followUi") }, ...LANGS.map((l) => ({ value: l, label: LANG_LABEL[l] }))]}
            value={guidePref}
            onChange={(v) => chooseGuideLang(v as GuideLangPref)}
          />
        </Section>

        <Section title={t(lang, "installTitle")}>
          {install === "installed" && <p className="text-[14px] text-muted">{t(lang, "installedAlready")}</p>}
          {install === "button" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "installAppHint")}</p>
              <button type="button" onClick={doInstall} className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-bg">
                {t(lang, "installApp")}
              </button>
            </div>
          )}
          {installTip && <p className="text-[14px] leading-6 text-ink-soft">{installTip}</p>}
        </Section>

        <Section title={t(lang, "dataSourcesTitle")}>
          <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "dataSourcesBody")}</p>
        </Section>

        <Section title={t(lang, "aboutTitle")}>
          <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "aboutBody")}</p>
          <p className="text-[12px] text-faint">
            {t(lang, "version")} {APP_VERSION}
          </p>
        </Section>

        <Section title={t(lang, "clearCache")}>
          <p className="text-[13px] leading-5 text-muted">{t(lang, "clearCacheHint")}</p>
          <button
            type="button"
            onClick={clearData}
            disabled={cleared}
            className="self-start rounded-full border border-line px-4 py-2 text-[13px] font-bold text-accent disabled:opacity-60"
          >
            {cleared ? t(lang, "cacheCleared") : t(lang, "clearCache")}
          </button>
        </Section>
      </main>
      <TabBar lang={lang} />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-surface px-5 py-4">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">{title}</h2>
      {children}
    </section>
  );
}

function Segmented({ options, value, onChange }: { options: Array<{ value: string; label: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              active ? "bg-ink text-bg" : "border border-line bg-surface text-ink hover:bg-surface-2"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
