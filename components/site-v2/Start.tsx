import { PlusNotify } from "@/components/site-v2/PlusNotify";
import { Icon, btnInner, btnPrimary, container } from "@/components/site-v2/ui";

/**
 * 收尾 CTA 横幅。样张几何（1024 宽）：容器内一条淡蓝（#EDF7FE）圆角横幅，高约 80px→112px；
 * 左：大蓝色定位图标 + 小字距标签 + 一行粗标题 + 一句说明；右：蓝色胶囊主按钮（纸飞机 + 文字 + 箭头）。
 * 样张右侧的城市剪影插画不复刻（装饰性生成图，不指向真实地点）。Plus 只留横幅下面极次要的一行，登记默认收起。
 */
export function Start({ appUrl, apkUrl, apkVersion }: { appUrl: string; apkUrl?: string; apkVersion?: string }) {
  return (
    <section id="start" className={`${container} pb-3 pt-3 lg:pb-6 lg:pt-6`} data-check="start">
      <div className="relative overflow-hidden rounded-[18px] bg-(--v2-band) px-6 py-5 md:px-8 lg:px-12 lg:py-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/60 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="flex items-start gap-4 md:items-center md:gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center text-(--v2-accent)" aria-hidden>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22s-8-7.1-8-13a8 8 0 1 1 16 0c0 5.9-8 13-8 13Z" />
                <circle cx="12" cy="9" r="3" fill="#fff" />
              </svg>
            </span>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5A7EAD]">Real places. Real stories.</p>
              <h2 className="mt-1 text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-(--v2-ink) md:text-[28px] lg:text-[32px]">Start exploring with ReAround You.</h2>
              <p className="mt-1.5 text-[14.5px] text-(--v2-muted) md:text-[16px]">Works in your browser. No account needed.</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
            <a href={appUrl} className={btnPrimary}>
              <span className={btnInner}>
                <Icon.Navigate size={18} />
                Try it where I am
                <Icon.ArrowRight size={18} className="-mr-1" />
              </span>
            </a>
            <p className="text-[12px] text-(--v2-muted)">
              {apkUrl ? (
                <>
                  <a href={apkUrl} download className="font-semibold text-(--v2-blue) underline-offset-2 fine:hover:underline">
                    Download Android beta
                  </a>
                  {apkVersion ? ` · version ${apkVersion}` : ""} · Android 7.0 or newer
                </>
              ) : (
                "Android beta · coming soon"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Plus：极次要的一行，登记默认收起 */}
      <div className="mt-2 flex flex-col gap-2 px-1 md:flex-row md:items-center md:justify-between">
        <p className="text-[13px] text-(--v2-muted)">
          <span className="mr-2 rounded-full border border-(--v2-line) bg-white px-2 py-0.5 text-[11px] font-semibold text-(--v2-ink2)">Coming soon · Plus</span>
          Longer routes you can save and pick up later.
        </p>
        <PlusNotify appUrl={appUrl} />
      </div>
    </section>
  );
}
