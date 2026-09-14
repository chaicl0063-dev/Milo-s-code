"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { Section, SubpageShell } from "@/components/SubpageShell";
import { BRAND } from "@/lib/site/brand";

/** 对外版本号：和安卓包 versionName 同步（android/app/build.gradle） */
const APP_VERSION = "1.1";

/** 关于：产品说明、数据来源、版本 */
export function AboutScreen() {
  const { lang } = useLanguage();
  return (
    <SubpageShell lang={lang} title={t(lang, "aboutTitle")}>
      <Section title="ReAround You">
        <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "aboutBody")}</p>
        <p className="text-[12px] text-faint">
          {t(lang, "version")} {APP_VERSION} · {t(lang, "betaLabel")} · {t(lang, "operatedBy")} {BRAND.operator}
        </p>
      </Section>
      <Section title={t(lang, "dataSourcesTitle")}>
        <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "dataSourcesBody")}</p>
      </Section>
      <Section title={t(lang, "legalTitle")}>
        <div className="flex flex-col divide-y divide-line">
          <a href={BRAND.privacyPath} className="py-3 text-[15px] font-semibold text-ink">
            {t(lang, "privacyPolicy")}
          </a>
          <a href={BRAND.termsPath} className="py-3 text-[15px] font-semibold text-ink">
            {t(lang, "termsOfUse")}
          </a>
        </div>
      </Section>
    </SubpageShell>
  );
}
