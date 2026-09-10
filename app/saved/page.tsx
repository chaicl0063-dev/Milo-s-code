import type { Metadata } from "next";
import { Suspense } from "react";
import { SavedScreen } from "@/components/SavedScreen";

export const metadata: Metadata = { title: "Offline copy · ReAround You" };

export default function SavedPage() {
  // SavedScreen 用了 useSearchParams，Next 要求包在 Suspense 里
  return (
    <Suspense fallback={<div className="min-h-dvh bg-surface" />}>
      <SavedScreen />
    </Suspense>
  );
}
