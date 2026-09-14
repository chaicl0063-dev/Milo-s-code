/**
 * 对外身份信息，只在这里改一处：页脚、联系页、隐私与条款页都从这里读。
 * 2026-09-15 用户确认：运营主体 Blue Hug LLC，官网域名 bubblefrog.fun，
 * 联系邮箱先用占位 hello@bubblefrog.fun（邮箱开通前收不到信，页面上注明 Beta）。
 */
export const BRAND = {
  name: "ReAround You",
  operator: "Blue Hug LLC",
  email: "hello@bubblefrog.fun",
  siteUrl: "https://bubblefrog.fun",
  /** 官网上的「隐私 / 条款」路径（域名分流后在官网域名下也可用 /privacy、/terms，见 proxy.ts） */
  privacyPath: "/site/privacy",
  termsPath: "/site/terms",
  /** 当前阶段标识；离开 Beta 时改这里 */
  stage: "Beta",
  legalUpdated: "2026-09-15",
} as const;

/** 应用地址：官网按钮用。部署时设 NEXT_PUBLIC_APP_URL（例如 https://app.bubblefrog.fun），没设就指向本站根路径 */
export function appUrlFromEnv(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "/";
}

/** 预填主题的反馈邮件链接（联系页和官网共用） */
export function feedbackMailto(context?: string): string {
  const subject = `${BRAND.name} ${BRAND.stage} feedback${context ? ` · ${context}` : ""}`;
  const body = ["Where were you (city / place):", "Device and browser or app:", "What did you try, and where did it stop:", "Was the story helpful:", ""].join("\n");
  return `mailto:${BRAND.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
