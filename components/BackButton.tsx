"use client";

import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/Icons";

/** 有历史就后退，没有（比如直接打开详情链接）就回首页 */
export function BackButton({ label, className = "" }: { label: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-surface/95 text-ink shadow-[0_4px_14px_rgba(27,31,29,0.12)] ${className}`}
    >
      <BackIcon />
    </button>
  );
}
