import { Suspense } from "react";
import { HomeScreen } from "@/components/HomeScreen";

export default function Home() {
  // HomeScreen 用了 useSearchParams，Next 要求包在 Suspense 里
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <HomeScreen />
    </Suspense>
  );
}
