"use client";

import { useEffect, useState } from "react";
import { GUIDE_LANGS, GUIDE_LANG_LABEL, t, type GuideLang, type Lang } from "@/lib/i18n";
import { browserGuideLang, setGuideLangPref, setOnboarded, setPersona } from "@/lib/prefs";
import { DEFAULT_PERSONA, type PersonaId } from "@/lib/personas";
import { PersonaPicker } from "@/components/PersonaPicker";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Segmented } from "@/components/SubpageShell";
import { SparkIcon } from "@/components/Icons";

interface Props {
  lang: Lang;
  onDone: () => void;
}

/** 首次进入的第一步：选讲解语言和导游人物。第二步（定位授权）由首页的正常流程接管。 */
export function Onboarding({ lang, onDone }: Props) {
  const [guideLang, setGuideLang] = useState<GuideLang>(lang);
  const [persona, setPersonaState] = useState<PersonaId>(DEFAULT_PERSONA);

  // 浏览器语言只能在客户端读
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuideLang(browserGuideLang(lang));
  }, [lang]);

  function finish() {
    setGuideLangPref(guideLang);
    setPersona(persona);
    setOnboarded();
    onDone();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-7 px-6 pb-9 pt-14">
      <div className="flex items-start justify-between">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E9DFD0] text-accent">
          <SparkIcon size={26} />
        </span>
        <LanguageToggle />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-[36px] leading-10">{t(lang, "onboardingTitle")}</h1>
        <p className="text-[15px] leading-6 text-muted">{t(lang, "onboardingBody")}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">{t(lang, "guideLanguage")}</h2>
        <Segmented
          options={GUIDE_LANGS.map((l) => ({ value: l, label: GUIDE_LANG_LABEL[l] }))}
          value={guideLang}
          onChange={(v) => setGuideLang(v as GuideLang)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">{t(lang, "yourGuide")}</h2>
        <PersonaPicker value={persona} onChange={setPersonaState} lang={lang} />
      </section>

      <div className="flex-1" />

      <button type="button" onClick={finish} className="flex h-14 items-center justify-center rounded-[18px] bg-ink text-[16px] font-bold text-bg">
        {t(lang, "next")}
      </button>
    </div>
  );
}
