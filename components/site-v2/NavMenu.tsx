"use client";

import { useEffect, useRef } from "react";
import { Icon, linkText } from "@/components/site-v2/ui";

/**
 * 手机顶栏的「Menu」按钮（需求 v2 §3.2）：承载桌面那三个段落入口，Open the app 仍单独常驻。
 * 用原生 <details>/<summary>，没有 JS 也能展开收起；JS 只负责选完收起、点外面收起、Escape 收起。
 * 面板里是真实锚点链接，定位由浏览器完成，不新增路由、不压历史记录。
 */
export function NavMenu() {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = () => {
      if (ref.current?.open) ref.current.open = false;
    };
    const onDoc = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className="relative md:hidden" data-check="nav-menu">
      <summary aria-label="Menu" className="group/btn inline-flex h-10 cursor-pointer touch-manipulation list-none items-center rounded-full border border-(--v2-line) bg-(--v2-surface) px-3 text-[14px] font-semibold text-(--v2-ink) transition-colors duration-150 marker:content-none fine:hover:bg-(--v2-surface2) motion-reduce:transition-none min-[400px]:px-3.5 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <Icon.List size={18} />
          <span className="hidden min-[400px]:inline">Menu</span>
        </span>
      </summary>
      <nav
        aria-label="Sections"
        onClick={() => {
          if (ref.current) ref.current.open = false;
        }}
        className="absolute right-0 top-full z-30 mt-2 w-[196px] rounded-[14px] border border-(--v2-line) bg-white p-1.5 shadow-(--v2-shadow)"
      >
        {[
          { href: "#see", text: "How it works" },
          { href: "#explore", text: "Walks" },
          { href: "#guides", text: "Guides" },
        ].map((l) => (
          <a key={l.href} href={l.href} className={`${linkText} block rounded-[10px] px-3 py-2.5 text-[15px] font-medium text-(--v2-nav)`}>
            {l.text}
          </a>
        ))}
      </nav>
    </details>
  );
}
