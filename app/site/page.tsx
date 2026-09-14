import type { Metadata } from "next";
import { SiteLanding } from "@/components/site/SiteLanding";
import { appUrlFromEnv } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: "ReAround You · A local friend in your pocket",
  description: "You're already here. Tell your AI guide what you feel like, and start walking. Any city, eight languages, free to listen.",
};

/**
 * 官网（挂在 /site；配置 SITE_HOSTS 后官网域名的根路径重写到这里，见 proxy.ts）。
 * 应用地址由 NEXT_PUBLIC_APP_URL 决定，没配就指向本站根路径；
 * 安卓包下载由 NEXT_PUBLIC_APK_URL / NEXT_PUBLIC_APK_VERSION 决定，没配显示 coming soon。
 */
export default function SitePage() {
  return <SiteLanding appUrl={appUrlFromEnv()} apkUrl={process.env.NEXT_PUBLIC_APK_URL || undefined} apkVersion={process.env.NEXT_PUBLIC_APK_VERSION || undefined} />;
}
