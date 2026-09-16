"use client";

import { MIA, PLACE, STORY, STREET } from "@/lib/site-v2/content";
import { PERSONA } from "@/lib/personas";
import { useScriptedSpeech } from "@/components/site/useScriptedSpeech";
import { Avatar, Icon, Pin, PlaceTag, PlayButton, Status, Tile, Waveform, btnGhost, btnIcon, btnInner, btnPrimary } from "@/components/site-v2/ui";
import { useVisualActive, waveMode } from "@/components/site-v2/motion";

/**
 * SCREEN 01 · HERE。2026-09-16「样张复刻」：几何与配色按 assets/reference/site-v4-sample-b-1455.png 量出（1024 宽 × 1.406 = 1440）。
 * 一幅连续构图：照片占右侧 64% 视口宽、贴满首屏高度、左缘约 14% 宽的羽化淡入页面底色（样张里照片在约 44–50% 处过渡）；
 * 左侧文字块从 5% 边距起：小标签 → 两行粗标题（海军蓝）→ 一句蓝色副标题 → 两个胶囊按钮 → 一排四个信息格。
 * 照片上：天空里的淡坐标、塔顶一个白环蓝心图钉 + 小地点标签、右侧天空里的主卡（缩略图 / 名字 / 距离 / 真实试听 / Mia 一句）。
 * 事实边界不变：访客位置不画；「120 m」是演示距离；信息格第一格写明 Sample location；只标画面里看得见的地标。
 * 手机（< lg）：文字 → 照片（< 400 正方形裁切，≥ 400 横图）→ 同一张卡（文档流，叠住照片下沿 80px）→ 信息格；手机不放次入口文字链接（F04：首屏要放下完整第一句）。
 * 客户端组件：主卡的播放是真实试听（useScriptedSpeech → /api/tts），桌面/手机两处渲染共用一份状态。
 */
export function Hero({ appUrl }: { appUrl: string }) {
  const speech = useScriptedSpeech(appUrl);
  const { landscape, square } = STREET.hero.pin;
  return (
    <section id="top" className="relative overflow-hidden">
      {/* 桌面：照片贴右、贴满首屏高度，左缘羽化 */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[64%] lg:block" aria-hidden>
        <img src={STREET.hero.src} srcSet={STREET.hero.srcSet} sizes="64vw" alt="" width={1920} height={1280} fetchPriority="high" decoding="async" className="h-full w-full object-cover object-[42%_50%] [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.55)_12%,#000_24%)]" />
        {/* 天空里的淡坐标（示例坐标） */}
        <p className="absolute left-[30%] top-[5%] text-[12px] font-medium leading-[1.5] tracking-[0.06em] text-(--v2-faint) tabular-nums">
          {PLACE.lat}
          <br />
          {PLACE.lon}
        </p>
      </div>

      {/* 桌面：照片上的图层，与照片框同一坐标系（右侧 64% 视口宽、贴满首屏高度） */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[64%] lg:block">
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${landscape.x}%`, top: `${landscape.y}%` }}>
          <Pin selected size={30} />
        </div>
        <div data-check="hero-pin-label" className="pointer-events-auto absolute -translate-y-1/2 translate-x-5" style={{ left: `${landscape.x}%`, top: `${landscape.y}%` }}>
          <PlaceTag name={PLACE.name} dist={`${PLACE.distance} away`} thumb={STREET.hero.thumb} />
        </div>
        <SampleChip />
        {/* 主卡：塔身右侧的天空 */}
        <div className="pointer-events-auto absolute right-[6%] top-[34%] w-[min(370px,48%)]">
          <PlaceCard appUrl={appUrl} speech={speech} />
        </div>
      </div>

      <div className="relative mx-auto grid max-w-[1440px] gap-5 px-5 md:px-[5%] lg:min-h-[540px] lg:grid-cols-[46%_1fr] lg:items-start lg:gap-0 xl:min-h-[560px]">
        {/* 左：文字块 */}
        <div className="pt-2 md:pt-6 lg:pt-10 xl:pt-12">
          <p className="hidden items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.2em] text-(--v2-label) sm:flex">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2 1v9M2 10l4-4M2 10l5 1" />
            </svg>
            AI local guide
          </p>
          <h1 className="mt-1 text-[34px] font-bold leading-[1.02] tracking-[-0.025em] text-(--v2-ink) sm:mt-5 sm:text-[44px] md:text-[56px] lg:text-[44px] xl:text-[54px] min-[1440px]:text-[64px]">
            Understand
            <br />
            what&rsquo;s around you.
          </h1>
          <p className="mt-2 text-[15px] font-medium leading-[1.4] text-(--v2-blue) sm:mt-4 sm:text-[18px] md:text-[20px] xl:text-[22px]">Real places. Real stories. Right where you are.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-7 sm:gap-y-3 md:gap-3.5">
            <a href={appUrl} className={`${btnPrimary} h-12 sm:h-14`}>
              <span className={btnInner}>
                <Icon.Navigate size={18} />
                Try it where I am
                <Icon.ArrowRight size={18} className="-mr-1" />
              </span>
            </a>
            <a href="#see" className={`${btnGhost.replace("inline-flex ", "")} hidden sm:inline-flex`}>
              <span className={btnInner}>
                <Icon.PlayCircle size={26} className="text-(--v2-accent)" />
                See how it works
              </span>
            </a>
          </div>

          {/* 一排四个信息格（桌面）。第一格写明是示例坐标 */}
          <div className="mt-9 hidden grid-cols-2 gap-2.5 lg:grid xl:mt-11 min-[1440px]:grid-cols-4" data-check="hero-meta">
            <MetaTiles />
          </div>
        </div>

        {/* 右：桌面只是占位（照片与图层在 section 里），手机是文档流里的照片 */}
        <div className="relative -mx-5 md:-mx-[5%] lg:mx-0">
          <div className="relative overflow-hidden aspect-square min-[400px]:aspect-[3/2] sm:aspect-[16/10] lg:hidden">
            <picture>
              <source media="(max-width: 399px)" srcSet={STREET.hero.square} />
              <img src={STREET.hero.src} srcSet={STREET.hero.srcSet} sizes="100vw" alt={STREET.hero.alt} width={1920} height={1280} fetchPriority="high" decoding="async" className="h-full w-full object-cover object-[42%_50%]" />
            </picture>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 min-[400px]:hidden" style={{ left: `${square.x}%`, top: `${square.y}%` }}>
              <Pin selected size={28} />
            </div>
            <div className="absolute hidden -translate-x-1/2 -translate-y-1/2 min-[400px]:block" style={{ left: `${landscape.x}%`, top: `${landscape.y}%` }}>
              <Pin selected size={28} />
            </div>
            <SampleChip />
          </div>

        </div>

        {/* 手机：同一张卡（同一份播放状态），紧贴照片下沿 */}
        <div className="relative z-10 -mt-20 mx-1 lg:hidden">
          <PlaceCard appUrl={appUrl} speech={speech} compact />
        </div>

        {/* 手机：信息格放在演示之后 */}
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <MetaTiles />
        </div>
      </div>

      <p className="mx-auto mt-2 max-w-[1440px] px-5 pb-6 text-[11.5px] text-(--v2-faint) md:px-[5%] lg:pb-3 lg:text-right">
        Photo{" "}
        <a href={STREET.hero.page} target="_blank" rel="noopener noreferrer" className="pointer-events-auto underline underline-offset-2">
          {STREET.hero.author}
        </a>{" "}
        ({STREET.hero.license}) · {PLACE.distance} is a demo distance
      </p>
    </section>
  );
}

function SampleChip() {
  return (
    <span data-check="hero-sample" className="pointer-events-auto absolute right-3 top-3 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--v2-label) shadow-(--v2-shadow-sm) backdrop-blur-[3px] sm:right-5 sm:top-5">
      Sample · Paris 4e
    </span>
  );
}

function MetaTiles() {
  return (
    <>
      <Tile
        icon={<Icon.Crosshair size={22} />}
        value={
          <>
            {PLACE.lat}
            <br />
            {PLACE.lon}
          </>
        }
        label="Sample location"
      />
      <Tile icon={<Icon.Building size={22} />} value={PLACE.areaShort.split(",")[0]} label="Paris 4e" />
      <Tile icon={<Icon.Pin size={22} />} value="Nearby places" label="Within 1 km" />
      <Tile icon={<Icon.Wave size={22} />} value="Guide ready" label={`${MIA.name} is ready`} live />
    </>
  );
}

type Speech = ReturnType<typeof useScriptedSpeech>;

/**
 * 主产品卡（样张 Old Bell Tower 卡的结构）：缩略图 + 名字 + 距离 + 箭头（真实链接）／播放 + 波形 + 进度／分隔线／Mia 头像 + 名字 + 当前这一句。
 * 播放是真实试听；「正在播放」以音频 playing 事件为准。compact 用于手机首屏：播放按钮并入标题行，省掉波形。
 */
function PlaceCard({ appUrl, speech, compact = false }: { appUrl: string; speech: Speech; compact?: boolean }) {
  const placeUrl = `${appUrl.replace(/\/$/, "")}${PLACE.appPath}`;
  const [waveRef, visuallyActive] = useVisualActive<HTMLDivElement>();
  const { state } = speech;
  const mine = state.key === "story";
  const playing = mine && state.status === "playing";
  const loading = mine && state.status === "loading";
  const paused = mine && state.status === "paused";
  const errored = mine && state.status === "error";
  const done = mine && state.status === "done";
  const idx = mine && state.index >= 0 ? Math.min(state.index, STORY.length - 1) : 0;
  const progress = done ? 1 : playing || paused ? (idx + 0.5) / STORY.length : 0;
  const statusText = playing ? "Speaking" : loading ? "Preparing" : paused ? "Paused" : errored ? "Voice unavailable" : "Ready";
  const label = playing ? "Pause" : paused ? "Resume" : loading ? "Preparing" : errored ? "Retry" : "Hear the story";
  const onClick = () => {
    if (playing) speech.pause();
    else if (paused) speech.resume();
    else void speech.play("story", STORY, PERSONA.mia.gender);
  };
  const button = (size: number) => (
    <button type="button" onClick={onClick} disabled={loading} aria-label={label} title={label} className={btnIcon}>
      <span className={`${btnInner} rounded-full`}>
        <PlayButton playing={playing} size={size} label={label} />
      </span>
    </button>
  );

  return (
    <div ref={waveRef} data-check="hero-card" className="rounded-[18px] border border-white/70 bg-white/92 p-3 shadow-(--v2-shadow) backdrop-blur-[6px] lg:p-4 xl:p-[18px]">
      <div className="flex items-center gap-3.5">
        <img src={STREET.hero.thumb} alt="" width={60} height={60} className="h-12 w-12 shrink-0 rounded-[10px] object-cover xl:h-[60px] xl:w-[60px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-bold leading-tight tracking-[-0.01em] text-(--v2-ink) xl:text-[20px]">{PLACE.name}</p>
          <p className="mt-1 text-[13.5px] leading-tight text-(--v2-muted) lg:text-[14px]">
            {PLACE.kind} · {PLACE.distance} away
          </p>
        </div>
        {compact ? (
          button(40)
        ) : (
          <a href={placeUrl} aria-label={`Open ${PLACE.name} in the app`} className={`${btnIcon} grid h-9 w-9 place-items-center text-(--v2-accent) transition-colors duration-150 fine:hover:bg-(--v2-accent-soft) motion-reduce:transition-none`}>
            <span className={`${btnInner} rounded-full`}>
              <Icon.Chevron size={22} />
            </span>
          </a>
        )}
      </div>
      {!compact && (
        <div className="mt-4 flex items-center gap-3.5 border-t border-(--v2-line) pt-4">
          {button(44)}
          <Waveform progress={progress} height={26} mode={waveMode(state.status, mine, visuallyActive)} className="min-w-0 flex-1 overflow-hidden" />
          <span className="shrink-0 text-[14px] font-medium tabular-nums text-(--v2-muted)">{mine && state.index >= 0 ? `${idx + 1} / ${STORY.length}` : `${STORY.length} sentences`}</span>
        </div>
      )}
      <div className={`flex items-start gap-3 border-t border-(--v2-line) ${compact ? "mt-2 pt-2" : "mt-4 pt-4"}`}>
        <Avatar src={MIA.image} name={MIA.name} size={compact ? 28 : 40} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-(--v2-ink)">{MIA.name}</span>
            <Status live={playing || loading}>{statusText}</Status>
          </div>
          <p className="mt-0.5 text-[14px] leading-[1.5] text-(--v2-muted)" aria-live={mine ? "polite" : undefined}>
            {STORY[idx]}
          </p>
        </div>
      </div>
      {compact && (
        <a href={placeUrl} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-(--v2-blue) transition-colors duration-150 fine:hover:text-(--v2-accent) motion-reduce:transition-none">
          Open this place in the app
          <Icon.Chevron size={16} />
        </a>
      )}
    </div>
  );
}
