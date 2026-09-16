import { ROUTE, ROUTE_ILLUSTRATION } from "@/lib/site-v2/content";
import { Icon, Label, Pin, btnGhost, btnInner, container, h2, h2Base, lead } from "@/components/site-v2/ui";

/**
 * 03 · KEEP EXPLORING（2026-09-16 换成生成插画，见 docs/SITE-V2-MAP-IMAGE-ACCEPTANCE-20260916.md）。
 * 桌面（≥1280）：一整幅 4:1 的虚构城市示意插画通栏铺满，左侧 5–35% 是插画留白，放网页文字、真实按钮与两项产品说明；
 * 图上不叠任何 SVG 路线、点位或旧地点卡；右下角一枚可读的「Illustrative route · not a real map」。
 * 1024–1279：4:1 太矮放不下左侧文字，文字放图上方。
 * 手机（<1024）：整图缩到 375 宽只有 94px 高看不清，所以只取起点到 Old market 的路线部分裁切作辅助示意（约 166px 高），三个示例场景用 HTML 有序列表列出（信息不依赖图中小字）。
 * 「About 1 hour」是产品的规划预算说明，不是这张插画的测量结果。不再显示旧巴黎三站、经纬度、OSM 署名与「Planned by the app」。
 */
export function Explore({ appUrl }: { appUrl: string }) {
  const base = appUrl.replace(/\/$/, "");
  const meta = [
    { icon: <Icon.Clock size={24} />, value: ROUTE.time, label: "the app plans around your time" },
    { icon: <Icon.Walk size={24} />, value: "A few stops", label: "in walking order, from where you stand" },
  ];
  const scenes = (
    <ol className="divide-y divide-(--v2-line) rounded-[14px] border border-(--v2-line) bg-white shadow-(--v2-shadow-sm)">
      {ROUTE_ILLUSTRATION.scenes.map((name, i) => (
        <li key={name} className="flex items-center gap-3 px-3.5 py-2.5">
          <Pin n={i + 1} size={28} />
          <p className="min-w-0 flex-1 text-[15px] font-semibold leading-tight text-(--v2-ink)">{name}</p>
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-(--v2-faint)">Example scene</span>
        </li>
      ))}
    </ol>
  );

  return (
    <section id="explore" className="py-6 lg:py-4">
      {/* 手机 / 平板 / 1024–1279：标题在插画上方 */}
      <div className={`${container} xl:hidden`}>
        <Label>03 / Keep exploring</Label>
        <h2 className={`${h2} mt-4`}>An hour to wander?</h2>
        <p className={`${lead} mt-4 max-w-[40ch]`}>Tell your guide how long you have and get a short walk with a few stops worth seeing, in order, from where you stand.</p>
      </div>

      {/* 插画：通栏。桌面整幅 4:1，手机取路线部分 */}
      <div className="relative mt-5 xl:mt-0">
        <div className="relative w-full">
          <picture>
            <source media="(min-width: 1024px)" srcSet={ROUTE_ILLUSTRATION.srcSet} sizes="100vw" width={ROUTE_ILLUSTRATION.width} height={ROUTE_ILLUSTRATION.height} />
            <img src={ROUTE_ILLUSTRATION.mobile.src} alt={ROUTE_ILLUSTRATION.alt} width={ROUTE_ILLUSTRATION.mobile.width} height={ROUTE_ILLUSTRATION.mobile.height} loading="lazy" decoding="async" className="block h-auto w-full" />
          </picture>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-(--v2-line)" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-(--v2-line)" aria-hidden />

          {/* 桌面：文字直接放在插画左侧留白 */}
          <div className="absolute left-[5%] top-[8%] hidden w-[30%] xl:block">
            <Label>03 / Keep exploring</Label>
            <h2 className={`${h2Base} mt-2.5 text-[34px]`}>An hour to wander?</h2>
            <p className={`${lead} mt-2.5 text-[15px]`}>Tell your guide how long you have. You get a short walk with a few stops worth seeing, in order, from where you stand.</p>
            <a href={`${base}/guide`} className={`${btnGhost} mt-4 h-11 px-5 text-[15px] text-(--v2-blue)`}>
              <span className={btnInner}>
                Plan an hour in the app <Icon.ArrowRight size={18} />
              </span>
            </a>
            <div className="mt-4 flex items-center gap-6">
              {meta.map((m) => (
                <div key={m.value} className="flex items-center gap-2.5">
                  <span className="text-(--v2-accent)">{m.icon}</span>
                  <div className="whitespace-nowrap leading-tight">
                    <p className="text-[15px] font-bold text-(--v2-ink)">{m.value}</p>
                    <p className="mt-0.5 text-[12.5px] text-(--v2-muted)">{m.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 示意说明：sm+ 在图上；手机图太矮，改由图下第一行文字承担 */}
          <span data-check="route-notice" className="absolute bottom-3 right-[5%] hidden rounded-full border border-(--v2-line) bg-white/92 px-3 py-1 text-[12px] font-semibold text-(--v2-muted) shadow-(--v2-shadow-sm) backdrop-blur-[2px] sm:inline-flex">
            {ROUTE_ILLUSTRATION.notice}
          </span>
        </div>
      </div>

      {/* 手机 / 平板 / 1024–1279：示例场景列表、说明与入口在插画下面 */}
      <div className={`${container} mt-4 xl:hidden`}>
        <p className="mb-3 text-[12px] text-(--v2-faint)">An illustrated example, not a real map: from Start, three stops in order.</p>
        {scenes}
        <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3">
          {meta.map((m) => (
            <div key={m.value} className="flex items-center gap-2.5">
              <span className="text-(--v2-accent)">{m.icon}</span>
              <div className="leading-tight">
                <p className="text-[15px] font-bold text-(--v2-ink)">{m.value}</p>
                <p className="mt-0.5 text-[13px] text-(--v2-muted)">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
        <a href={`${base}/guide`} className={`${btnGhost} mt-5 h-12 px-6 text-[15px] text-(--v2-blue)`}>
          <span className={btnInner}>
            Plan an hour in the app <Icon.ArrowRight size={18} />
          </span>
        </a>
      </div>
    </section>
  );
}
