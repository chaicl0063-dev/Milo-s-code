"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { Section, SubpageShell } from "@/components/SubpageShell";

const APP_VERSION = "0.4";

/** 关于：产品说明、数据来源、版本 */
export function AboutScreen() {
  const { lang } = useLanguage();
  return (
    <SubpageShell lang={lang} title={t(lang, "aboutTitle")}>
      <Section title="ReAround You">
        <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "aboutBody")}</p>
        <p className="text-[12px] text-faint">
          {t(lang, "version")} {APP_VERSION}
        </p>
      </Section>
      <Section title={t(lang, "dataSourcesTitle")}>
        <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "dataSourcesBody")}</p>
      </Section>
    </SubpageShell>
  );
}
