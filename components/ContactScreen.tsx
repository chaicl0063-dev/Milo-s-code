"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { Section, SubpageShell } from "@/components/SubpageShell";
import { MailIcon } from "@/components/Icons";

/** 联系我们：先只是入口，联系方式和反馈表单以后再放 */
export function ContactScreen() {
  const { lang } = useLanguage();
  return (
    <SubpageShell lang={lang} title={t(lang, "contactUs")}>
      <Section title={t(lang, "feedback")}>
        <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "contactBody")}</p>
        <button type="button" disabled className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-ink text-[15px] font-bold text-bg opacity-40">
          <MailIcon size={18} />
          {t(lang, "sendFeedback")} · {t(lang, "comingSoon")}
        </button>
      </Section>
    </SubpageShell>
  );
}
