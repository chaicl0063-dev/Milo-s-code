import type { MetadataRoute } from "next";

/** PWA 清单：手机「添加到主屏幕」时用的名字、图标、颜色和启动方式。Next 会把它挂在 /manifest.webmanifest */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReAround You · AI Tour Guide",
    short_name: "ReAround You",
    description: "See what is around you and hear its story, anywhere in the world.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f1ea",
    theme_color: "#f4f1ea",
    lang: "en",
    categories: ["travel", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
