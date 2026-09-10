"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { isValidEmail, useAccount } from "@/lib/account";
import { getPersona } from "@/lib/prefs";
import { useLanguage } from "@/components/LanguageProvider";
import { SubpageShell } from "@/components/SubpageShell";
import { AppleIcon, CheckIcon, GoogleIcon, MailIcon } from "@/components/Icons";

/**
 * 登录 / 注册：三张卡片。Apple、Google 先只是入口（需要开发者账号和第三方登录配置），
 * 邮箱是真的：登记到服务端（/api/signup），本机记住登录态。
 */
export function LoginScreen() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [account, setAccount] = useAccount();
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [soon, setSoon] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email) || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), lang, persona: getPersona() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAccount({ email: email.trim().toLowerCase(), provider: "email", since: Date.now() });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (account) {
    return (
      <SubpageShell lang={lang} title={t(lang, "account")}>
        <section className="flex flex-col gap-4 rounded-[20px] bg-surface px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-bg">
              <CheckIcon size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-ink">{account.email}</p>
              <p className="text-[13px] text-muted">{t(lang, status === "done" ? "signedUpHint" : "signedInAs")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAccount(null);
              setStatus("idle");
              setEmail("");
              setEmailOpen(false);
            }}
            className="h-11 self-start rounded-full border border-line px-5 text-[14px] font-semibold text-ink"
          >
            {t(lang, "signOut")}
          </button>
        </section>
      </SubpageShell>
    );
  }

  const cardClass = "flex h-14 w-full items-center gap-3 rounded-[18px] border border-line bg-surface px-4 text-left text-[15px] font-semibold text-ink";

  return (
    <SubpageShell lang={lang} title={t(lang, "loginTitle")}>
      <p className="-mt-2 text-[14px] leading-6 text-muted">{t(lang, "loginBody")}</p>

      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => setSoon("apple")} className={cardClass}>
          <AppleIcon size={22} />
          <span className="flex-1">{t(lang, "continueApple")}</span>
          {soon === "apple" && <span className="text-[12px] font-semibold text-faint">{t(lang, "comingSoon")}</span>}
        </button>
        <button type="button" onClick={() => setSoon("google")} className={cardClass}>
          <GoogleIcon size={22} />
          <span className="flex-1">{t(lang, "continueGoogle")}</span>
          {soon === "google" && <span className="text-[12px] font-semibold text-faint">{t(lang, "comingSoon")}</span>}
        </button>
        {emailOpen ? (
          <form onSubmit={submit} className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
            <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint" htmlFor="signup-email">
              {t(lang, "emailLabel")}
            </label>
            <input
              id="signup-email"
              type="email"
              autoFocus
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-11 rounded-full border border-line bg-bg px-4 text-[15px] outline-none focus:border-ink"
            />
            <button type="submit" disabled={!isValidEmail(email) || status === "sending"} className="h-12 rounded-[16px] bg-ink text-[15px] font-bold text-bg disabled:opacity-40">
              {status === "sending" ? t(lang, "sending") : t(lang, "continue")}
            </button>
            {status === "error" && <p className="text-[13px] text-accent">{t(lang, "signupFailed")}</p>}
            <p className="text-[11px] leading-4 text-faint">{t(lang, "signupPrivacy")}</p>
          </form>
        ) : (
          <button type="button" onClick={() => setEmailOpen(true)} className={cardClass}>
            <MailIcon size={22} />
            <span className="flex-1">{t(lang, "continueEmail")}</span>
          </button>
        )}
      </div>

      <button type="button" onClick={() => router.back()} className="self-start text-[14px] font-semibold text-muted">
        {t(lang, "later")}
      </button>
    </SubpageShell>
  );
}
