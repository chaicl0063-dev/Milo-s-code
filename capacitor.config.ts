import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 安卓壳（Capacitor）。第一阶段是「远程加载」：安装包里只有一个占位页（app-shell/），
 * 真正的界面从 server.url 加载，网页一更新，装了 APK 的手机下次打开就是新版。
 * 官网做完、界面稳定后再改成内置前端（把 Next.js 前端静态导出到 webDir，去掉 server.url）。
 *
 * appId 暂用占位，正式发布前按官网域名倒过来改（发布后不能再改）。
 */
const config: CapacitorConfig = {
  appId: "com.rearound.app",
  appName: "ReAround You",
  webDir: "app-shell",
  server: {
    // 换了正式域名后改这里（例如 https://app.rearound.xxx）
    url: "https://milo-s-code.vercel.app",
    // 允许壳里的 WebView 打开这些域名（其余外链交给系统浏览器）
    allowNavigation: ["milo-s-code.vercel.app", "*.vercel.app"],
    androidScheme: "https",
  },
  android: {
    // 允许 http 的图片/瓦片（OSM 瓦片是 https，这里只是保险）
    allowMixedContent: false,
    backgroundColor: "#F4F1EA",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#F4F1EA",
    },
  },
};

export default config;
