import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PwaRegister } from "@/components/PwaRegister";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Around You · AI Tour Guide",
  description: "See what is around you and learn its story, anywhere in the world.",
  applicationName: "Around You",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Around You" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f4f1ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* 尽早抓住浏览器的「可以安装」事件：它可能在 React 挂载前就触发，错过就不再来 */}
        <Script id="pwa-install-capture" strategy="beforeInteractive">
          {`window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installPrompt=e;window.dispatchEvent(new Event('pwa:installable'));});`}
        </Script>
        <LanguageProvider>{children}</LanguageProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
