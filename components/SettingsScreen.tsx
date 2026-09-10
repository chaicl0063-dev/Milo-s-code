"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GUIDE_LANGS, GUIDE_LANG_LABEL, LANGS, t, type GuideLang, type Lang } from "@/lib/i18n";
import { clearAllLocalData, getAudience, getAutoSpeak, resolveGuideLang, setAudience, setAutoSpeak, setGuideLangPref, type Audience } from "@/lib/prefs";
import { speechSupported } from "@/lib/speech";
import { useLanguage } from "@/components/LanguageProvider";
import { Section, Segmented, SubpageShell } from "@/components/SubpageShell";

const LANG_LABEL: Record<Lang, string> = { en: "English", zh: "中文" };

/** 设置：界面语言、讲解语言、安装到桌面、清除缓存 */
export function SettingsScreen() {
  const { lang, setLang } = useLanguage();
  const router = useRouter();
  const [guideLang, setGuideLangState] = useState<GuideLang>(lang);
  const [audience, setAudienceState] = useState<Audience>("adult");
  const [autoSpeak, setAutoSpeakState] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [install, setInstall] = useState<"unknown" | "installed" | "button" | "ios" | "android" | "desktop">("unknown");
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuideLangState(resolveGuideLang(lang));
    setAudienceState(getAudience());
    setAutoSpeakState(getAutoSpeak());
    setCanSpeak(speechSupported());
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    const decide = () => {
      if (standalone) return "installed" as const;
      if (window.__installPrompt) return "button" as const;
      if (/iPhone|iPad|iPod/.test(ua)) return "ios" as const;
      if (/Android/i.test(ua)) return "android" as const;
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
  }, [lang]);

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
    <SubpageShell lang={lang} title={t(lang, "settings")}>
      <Section title={t(lang, "uiLanguage")}>
        <Segmented options={LANGS.map((l) => ({ value: l, label: LANG_LABEL[l] }))} value={lang} onChange={(v) => setLang(v as Lang)} />
      </Section>

      <Section title={t(lang, "guideLanguage")}>
        <Segmented
          options={GUIDE_LANGS.map((l) => ({ value: l, label: GUIDE_LANG_LABEL[l] }))}
          value={guideLang}
          onChange={(v) => {
            setGuideLangState(v as GuideLang);
            setGuideLangPref(v as GuideLang);
          }}
        />
      </Section>

      <Section title={t(lang, "audience")}>
        <Segmented
          options={[
            { value: "adult", label: t(lang, "audienceAdult") },
            { value: "kids", label: t(lang, "audienceKids") },
          ]}
          value={audience}
          onChange={(v) => {
            setAudienceState(v as Audience);
            setAudience(v as Audience);
          }}
        />
      </Section>

      {canSpeak && (
        <Section title={t(lang, "autoSpeak")}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] leading-5 text-muted">{t(lang, "autoSpeakHint")}</p>
            <button
              type="button"
              role="switch"
              aria-checked={autoSpeak}
              onClick={() => {
                setAutoSpeakState(!autoSpeak);
                setAutoSpeak(!autoSpeak);
              }}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${autoSpeak ? "bg-accent" : "bg-line"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-[left] ${autoSpeak ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </Section>
      )}

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
    </SubpageShell>
  );
}
