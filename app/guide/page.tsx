import type { Metadata } from "next";
import { GuideScreen } from "@/components/GuideScreen";
import { llmConfigured } from "@/lib/guide";

export const metadata: Metadata = { title: "Guide · ReAround You" };

export default function GuidePage() {
  return <GuideScreen llmReady={llmConfigured()} />;
}
