import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteV2Landing } from "@/components/site-v2/SiteV2Landing";
import { appUrlFromEnv } from "@/lib/site/brand";

/** 样张字形接近 Inter；只在 V2 根节点上生效，不影响应用与旧站 */
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "ReAround You · Understand what's around you",
  description: "See what's nearby, hear the story behind it, ask a question, and keep exploring.",
  robots: { index: false, follow: false },
};

/**
 * 官网 V2 预览路由。评审通过前 /site 保持不动；通过后由这里替换 /site。
 * 应用地址由 NEXT_PUBLIC_APP_URL 决定；安卓包下载由 NEXT_PUBLIC_APK_URL / NEXT_PUBLIC_APK_VERSION 决定，没配显示 coming soon。
 */
export default function SiteV2Page() {
  return <SiteV2Landing fontClass={inter.variable} appUrl={appUrlFromEnv()} apkUrl={process.env.NEXT_PUBLIC_APK_URL || undefined} apkVersion={process.env.NEXT_PUBLIC_APK_VERSION || undefined} />;
}
