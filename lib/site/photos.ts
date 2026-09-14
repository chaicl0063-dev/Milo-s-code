/**
 * 官网用的照片：全部来自 Wikimedia Commons，可商用但要署名（CC BY / CC BY-SA）。
 * 文件已下载到 public/site/（Commons 的缩略图服务有限流，不能直接外链）。页脚的 Photo credits 由这张表生成。
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

const page = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const PHOTOS = {
  hero: {
    // IMG-01：AI 生成的品牌氛围图（虚构街景），见 docs/IMAGE-MANIFEST.md
    src: "/images/hero-1672.jpg",
    srcSet: "/images/hero-1200.jpg 1200w, /images/hero-1672.jpg 1672w",
    portraitSrc: "/images/hero-portrait.jpg",
    alt: "A traveler pausing to look up at an architectural detail on a sunlit street.",
    title: "Brand mood image (fictional street)",
    author: "ReAround You",
    license: "AI-generated brand image",
    page: "",
    generated: true,
  },
  square: {
    src: "/site/square.jpg",
    alt: "A sunny square in Porto with people and a tram",
    title: "Praça de Almeida Garrett, Porto",
    author: "Krzysztof Golik",
    license: "CC BY-SA 4.0",
    page: page("Praca_de_Almeida_Garrett_in_Porto.jpg"),
  },
  look: {
    src: "/site/eat.jpg",
    alt: "A street lined with café terraces and people walking",
    title: "Sint Janstraat, Breda",
    author: "Renée Kools",
    license: "CC BY 4.0",
    page: page("Breda_Sint_Janstraat_zicht_op_de_Grote_Markt_2024-09-20.jpg"),
  },
  walk: {
    src: "/site/walk.jpg",
    alt: "A quiet lane of hanok houses in Bukchon, Seoul",
    title: "Bukchon Hanok Village, Seoul",
    author: "Basile Morin",
    license: "CC BY-SA 4.0",
    page: page("Bukchon-ro_11-gil_street_with_hanok_houses_and_wooden_gate_in_Bukchon_Hanok_Village_Seoul.jpg"),
  },
  listen: {
    src: "/site/listen.jpg",
    alt: "Tour Saint-Jacques at dusk with the Eiffel Tower behind",
    title: "Tour Saint-Jacques au crépuscule",
    author: "Fabien Barrau",
    license: "CC BY-SA 4.0",
    page: page("Tour_Saint-Jacques_au_cr%C3%A9puscule.jpg"),
  },
  alley: {
    src: "/site/alley.jpg",
    alt: "A narrow stepped alley in Naples with plants on the walls",
    title: "Rampe San Marcellino, Naples",
    author: "Diego Delso",
    license: "CC BY-SA 4.0",
    page: page("Rampe_San_Marcellino,_N%C3%A1poles,_Italia,_2023-03-25,_DD_52.jpg"),
  },
} satisfies Record<string, SitePhoto>;

export type PhotoKey = keyof typeof PHOTOS;
