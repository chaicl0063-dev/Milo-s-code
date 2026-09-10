"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";
import { ChatIcon, PinIcon, UserIcon } from "@/components/Icons";

/** 底部 tab 栏的高度（不含手机底部安全区），首页布局要为它留出空间 */
export const TAB_BAR_HEIGHT = 56;

/** 三个一级页面：身边（地图）、导游（AI 中心）、我的（设置与说明） */
export function TabBar({ lang }: { lang: Lang }) {
  const path = usePathname();
  const tabs = [
    { href: "/", label: t(lang, "tabAround"), icon: <PinIcon size={22} />, active: path === "/" },
    { href: "/guide", label: t(lang, "tabGuide"), icon: <ChatIcon size={22} />, active: path.startsWith("/guide") },
    { href: "/me", label: t(lang, "tabMe"), icon: <UserIcon size={22} />, active: path.startsWith("/me") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1002] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex h-14 max-w-[520px] items-stretch">
        {tabs.map((tab) => (
          <li key={tab.href} className="flex-1">
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                tab.active ? "text-ink" : "text-faint"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
