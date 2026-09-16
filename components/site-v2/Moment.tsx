import { LAYERS, PLACE } from "@/lib/site-v2/content";
import { Icon, Label, LockCorners, container, h2Base, lead } from "@/components/site-v2/ui";
import { Reveal } from "@/components/site-v2/motion";

const LAYER_ICONS = [Icon.Book, Icon.Sound, Icon.Eye, Icon.Chat];

/**
 * 01 · THE MOMENT。样张几何（1024 宽）：白色横带；左 5–33% 文字（标签、两行粗标题、四行正文）；
 * 中 37–74% 一张 16:9 圆角照片卡（识别框 + 顶部地点小卡 + 左下白色坐标）；右 76–97% 白色面板「SAME PLACE / A DEEPER LAYER」四行圆形图标 + 文字。
 * 照片是 Commons 真实细部照（Ibex73，détails (1)）；识别框套在左上的尖顶与持杖雕像上，三种容器比例各一组坐标。
 * 叙事是用户主动的动作：在地图上点它，或拍照问「这是什么」（应用真实的 What is this? 入口）。坐标是示例，图下注明。
 */
export function Moment() {
  return (
    <section id="moment" className="bg-white py-7 lg:py-7">
      <div className={`${container} grid gap-6 lg:grid-cols-[32fr_35fr_20fr] lg:items-center lg:gap-[3%] [&>*]:min-w-0`}>
        <div>
          <Label>01 / The moment</Label>
          <h2 className={`${h2Base} mt-3 text-[32px] md:text-[36px] lg:text-[30px]`}>You&rsquo;re already here. Now let&rsquo;s understand it.</h2>
          <p className={`${lead} mt-4 max-w-[38ch]`}>You look up at a building you don&rsquo;t know. Tap it on the map, or take a photo and ask what it is. Your guide takes it from there.</p>
        </div>

        {/* 照片卡 + 右面板：一个显现组（M-D2）；整组透明度变化，识别框与小卡不单独动 */}
        <Reveal>
        <figure className="-mx-2 sm:mx-0">
          <div className="relative overflow-hidden rounded-[14px] bg-(--v2-surface2) shadow-(--v2-shadow-sm) aspect-[4/5] sm:aspect-[4/3] lg:aspect-[16/9]">
            <picture>
              <source media="(max-width: 639px)" srcSet={PLACE.photo.detailPortrait} />
              <img src={PLACE.photo.detail} alt={PLACE.photo.detailAlt} width={1800} height={1200} loading="lazy" decoding="async" className="h-full w-full object-cover object-center lg:object-top" />
            </picture>

            {/* 识别框：手机 4:5 / 平板 4:3 / 桌面 16:9 各一组坐标，都套在尖顶与持杖雕像上 */}
            <div className="absolute left-[17%] top-[3%] h-[55%] w-[44%] rounded-[6px] ring-1 ring-white/35 sm:left-[5%] sm:top-[3%] sm:h-[58%] sm:w-[25%] lg:left-[9%] lg:top-[6%] lg:h-[64%] lg:w-[22%]">
              <LockCorners />
            </div>

            {/* 顶部：地点小卡（样张里识别框上的 Old Bell Tower 120 m） */}
            <div data-check="moment-card" className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2.5 rounded-[12px] border border-white/70 bg-white/92 p-2 pr-3.5 shadow-(--v2-shadow-sm) backdrop-blur-[3px] sm:left-[58%] sm:top-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-(--v2-accent-soft) text-(--v2-accent)">
                <Icon.Pin size={20} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="whitespace-nowrap text-[14px] font-bold text-(--v2-ink)">{PLACE.name}</p>
                <p className="mt-0.5 text-[12.5px] text-(--v2-muted)">
                  {PLACE.kind} · {PLACE.distance}
                </p>
              </div>
            </div>
            {/* 右下：用户的动作（应用里的真实按钮文案） */}
            <span data-check="moment-action" className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-(--v2-accent) px-3 py-1.5 text-[12px] font-semibold text-white shadow-(--v2-shadow-sm) sm:bottom-4 sm:right-4">
              <Icon.Crosshair size={14} /> What is this?
            </span>
            {/* 左下：坐标与区域（示例），白字 */}
            <div data-check="moment-coords" className="absolute bottom-3 left-3 text-[12px] font-semibold leading-[1.5] tracking-[0.02em] text-white tabular-nums [text-shadow:0_1px_6px_rgba(0,0,0,0.55)] sm:bottom-4 sm:left-4 sm:text-[13px]">
              {PLACE.lat}, {PLACE.lon}
              <br />
              {PLACE.area}
            </div>
          </div>
          <figcaption className="mt-2 text-[11.5px] text-(--v2-faint)">
            Photo{" "}
            <a href={PLACE.photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              {PLACE.photo.author}
            </a>{" "}
            ({PLACE.photo.license}) · sample location
          </figcaption>
        </figure>

        {/* 同一个地点，多一层 */}
        <div className="rounded-[14px] border border-(--v2-line) bg-white p-5 shadow-(--v2-shadow-sm) lg:px-5 lg:py-5">
          <p className="text-[12.5px] font-bold uppercase leading-[1.5] tracking-[0.18em] text-(--v2-ink2)">
            Same place
            <br />a deeper layer
          </p>
          {/* 样张每行只有一个短标题；解释性小字去掉，放在 title 属性里（F01） */}
          <ul className="mt-3 divide-y divide-(--v2-line)">
            {LAYERS.map((l, i) => {
              const I = LAYER_ICONS[i];
              return (
                <li key={l.title} className="flex items-center gap-3.5 py-2.5" title={l.text}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-(--v2-line-blue) bg-(--v2-accent-soft) text-(--v2-accent)">
                    <I size={17} />
                  </span>
                  <p className="min-w-0 text-[14.5px] font-medium leading-tight text-(--v2-ink2)">{l.title}</p>
                </li>
              );
            })}
          </ul>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
