"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { Section, SubpageShell } from "@/components/SubpageShell";
import { MailIcon } from "@/components/Icons";
import { BRAND, feedbackMailto } from "@/lib/site/brand";

/**
 * 联系我们：邮件反馈（预填主题和几个问题）、官网二维码（分享给另一台手机）、隐私与条款入口。
 * 二维码是 public/images/qr-site.svg（内容 = 官网地址）；以后要换成客服账号的码，只换这张图和文案。
 */
export function ContactScreen() {
  const { lang } = useLanguage();
  return (
    <SubpageShell lang={lang} title={t(lang, "contactUs")}>
      <Section title={t(lang, "feedback")}>
        <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "contactBody")}</p>
        <a href={feedbackMailto("app")} className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-ink text-[15px] font-bold text-bg">
          <MailIcon size={18} />
          {t(lang, "sendFeedback")}
        </a>
        <p className="text-center text-[13px] text-faint">{BRAND.email}</p>
      </Section>
      <Section title={t(lang, "shareTitle")}>
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/qr-site.svg" alt={`QR code for ${BRAND.siteUrl}`} width={132} height={132} className="h-[132px] w-[132px] shrink-0 rounded-[12px] bg-white p-2" />
          <div className="min-w-0">
            <p className="text-[14px] leading-6 text-ink-soft">{t(lang, "shareBody")}</p>
            <a href={BRAND.siteUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block break-all text-[13px] font-semibold text-ink underline underline-offset-2">
              {BRAND.siteUrl.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </div>
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
        <p className="text-[12px] text-faint">
          {t(lang, "operatedBy")} {BRAND.operator} · {t(lang, "betaLabel")}
        </p>
      </Section>
    </SubpageShell>
  );
}
