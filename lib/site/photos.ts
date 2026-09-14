/**
 * 官网用的图片。2026-09-14 起全部换成用户手动生成的 AI 品牌氛围图（虚构街景与角色），
 * 原图在 assets/generated/，网页版在 public/images/，清单见 docs/IMAGE-MANIFEST.md。
 * 它们不是真实地点的照片，页脚统一注明。例外：首屏演示用的圣雅克塔是真实照片（Commons，需署名）。
 */
export interface SitePhoto {
  /** 本站 public 下的文件 */
  src: string;
  alt: string;
  title: string;
  author: string;
  license: string;
  /** 来源页；AI 生成的品牌氛围图没有来源页，为空 */
  page: string;
  /** 手机竖屏用的另一张裁切（可选） */
  portraitSrc?: string;
  /** 更小的版本，给 srcSet（可选） */
  srcSet?: string;
  /** true = AI 生成的虚构场景，不是真实地点照片 */
  generated?: boolean;
}

const generated = (src: string, alt: string, title: string, extra: Partial<SitePhoto> = {}): SitePhoto => ({
  src,
  alt,
  title,
  author: "ReAround You",
  license: "AI-generated brand image",
  page: "",
  generated: true,
  ...extra,
});

export const PHOTOS = {
  /** 演示用的真实地点照片（Wikimedia Commons，CC BY-SA 4.0，Fabien Barrau） */
  demoPlace: {
    src: "/images/tour-saint-jacques-720.jpg",
    srcSet: "/images/tour-saint-jacques-720.jpg 720w, /images/tour-saint-jacques-1280.jpg 1280w",
    alt: "Tour Saint-Jacques in Paris at dusk, the Eiffel Tower in the distance",
    title: "Tour Saint-Jacques au crépuscule",
    author: "Fabien Barrau",
    license: "CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:Tour_Saint-Jacques_au_cr%C3%A9puscule.jpg",
  } as SitePhoto,
  /** IMG-01：首屏。桌面横图 + 手机竖版（用户另生成的 4:5 版本） */
  hero: generated("/images/hero-1672.jpg", "A traveler pausing to look up at an architectural detail on a sunlit street.", "Brand mood image (fictional street)", {
    srcSet: "/images/hero-1200.jpg 1200w, /images/hero-1672.jpg 1672w",
    portraitSrc: "/images/hero-portrait.jpg",
  }),
  /** IMG-05：路线区氛围图 */
  square: generated("/images/square.jpg", "A small sunlit square with warm facades, café umbrellas and a side street leading away.", "Brand mood image (fictional square)"),
  /** IMG-04a：Look */
  look: generated("/images/look.jpg", "A traveler looking up at a carved doorway on a quiet historic street.", "Brand mood image (fictional street)"),
  /** IMG-04b：Walk */
  walk: generated("/images/walk.jpg", "A traveler walking away down a narrow lane with plants and warm plaster walls.", "Brand mood image (fictional lane)"),
  /** IMG-04c：Listen */
  listen: generated("/images/listen.jpg", "A carved church facade and bell tower catching the last light of the day.", "Brand mood image (fictional facade)"),
  /** IMG-06：傍晚场景屏 */
  alley: generated("/images/dusk.jpg", "A lane at dusk with light from a doorway and a lone walker in the distance.", "Brand mood image (fictional lane at dusk)"),
} satisfies Record<string, SitePhoto>;

export type PhotoKey = keyof typeof PHOTOS;
