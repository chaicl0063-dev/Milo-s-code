import { Icon, btnInner, container, linkText } from "@/components/site-v2/ui";
import { NavMenu } from "@/components/site-v2/NavMenu";

/**
 * 顶栏（样张：左标志 + 品牌名，中间灰色链接，右侧一个蓝色胶囊按钮）。
 * 只放真实存在的入口：两个锚点、进入应用；不放搜索、语言、Cities、Blog 这类没有落点的项。
 */
export function Nav({ appUrl }: { appUrl: string }) {
  return (
    <header className="relative z-20 shrink-0">
      <div className={`${container} flex h-14 items-center justify-between md:h-16 lg:h-[76px]`}>
        <a href="#top" className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[17px] font-bold tracking-[-0.01em] text-(--v2-ink)">
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-(--v2-accent) text-white shadow-[0_2px_8px_rgba(10,111,184,0.3)]" aria-hidden>
            <Icon.Navigate size={16} />
          </span>
          ReAround You
        </a>
        <div className="flex shrink-0 items-center gap-2 md:gap-8">
          <nav className="hidden items-center gap-8 text-[14.5px] font-medium text-(--v2-nav) md:flex" aria-label="Sections">
            <a href="#see" className={linkText}>
              How it works
            </a>
            <a href="#explore" className={linkText}>
              Walks
            </a>
            <a href="#guides" className={linkText}>
              Guides
            </a>
          </nav>
          <NavMenu />
          <a href={appUrl} className="group/btn inline-flex h-10 touch-manipulation items-center rounded-full bg-(--v2-accent) px-4 text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(10,111,184,0.25)] min-[400px]:px-5 transition-[color,background-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] fine:hover:bg-(--v2-accent-deep) motion-reduce:transition-none lg:h-11 lg:px-6">
            <span className={btnInner}>Open the app</span>
          </a>
        </div>
      </div>
    </header>
  );
}
