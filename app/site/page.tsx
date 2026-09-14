import type { Metadata } from "next";
import { SiteLanding } from "@/components/site/SiteLanding";

export const metadata: Metadata = {
  title: "ReAround You · A local friend in your pocket",
  description: "You're already here. Tell your AI guide what you feel like, and start walking. Any city, eight languages, free to listen.",
};

/**
 * 官网（临时挂在 /site，域名分流后放到主域名）。
 * 应用地址由 NEXT_PUBLIC_APP_URL 决定，没配就指向本站根路径。
 */
export default function SitePage() {
  return <SiteLanding appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "/"} />;
}
