import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 安卓壳（Capacitor）。Beta 阶段是「远程加载」：安装包里只有一个占位页（app-shell/），
 * 真正的界面从 server.url 加载，网页一更新，装了 APK 的手机下次打开就是新版（需要联网）。
 * 界面稳定后再改成内置前端（把前端静态导出到 webDir，去掉 server.url）。
 *
 * 加载地址由环境变量 CAP_SERVER_URL 决定（例如 https://app.bubblefrog.fun），打包时设置：
 *   CAP_SERVER_URL=https://app.bubblefrog.fun pnpm exec cap sync android
 * 没设就用 Beta 测试地址。地址会写进安装包，换地址必须重新打包并让用户升级。
 *
 * appId 一旦对外分发就不能再改（改了等于另一个应用，无法覆盖升级）。
 */
const serverUrl = process.env.CAP_SERVER_URL?.replace(/\/$/, "") || "https://milo-s-code.vercel.app";
const serverHost = new URL(serverUrl).host;

const config: CapacitorConfig = {
  appId: "com.rearound.app",
  appName: "ReAround You",
  webDir: "app-shell",
  server: {
    url: serverUrl,
    // 只允许壳内 WebView 停留在应用自己的域名；其它外链交给系统浏览器
    allowNavigation: [serverHost],
    androidScheme: "https",
  },
  android: {
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
