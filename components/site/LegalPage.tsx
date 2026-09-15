import Link from "next/link";
import { BRAND } from "@/lib/site/brand";
import { T } from "@/lib/site/theme";


/**
 * 隐私 / 条款页的共用外壳：和官网同一套颜色，正文用普通排版，不做花样。
 * 内容由各页传入；页脚给出运营主体与联系邮箱。
 */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.ink }}>
      <header className="border-b" style={{ borderColor: T.line }}>
        <div className="mx-auto flex max-w-[820px] items-center justify-between px-5 py-5">
          <Link href="/site" className="flex items-center gap-2.5 text-[15px] font-bold" style={{ color: T.ink }}>
            <span className="relative inline-block h-5 w-5 rounded-full" style={{ background: T.ink }}>
              <span className="absolute left-[5px] top-[5px] h-[10px] w-[10px] rounded-full" style={{ background: "#D9633A" }} />
            </span>
            {BRAND.name}
          </Link>
          <span className="rounded-full border px-3 py-1 text-[12px] font-bold" style={{ borderColor: T.line, color: T.muted }}>
            {BRAND.stage}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-[820px] px-5 py-10 md:py-14">
        <h1 className="font-semibold tracking-[-0.02em] text-[40px] leading-[1.02] md:text-[52px]">{title}</h1>
        <p className="mt-3 text-[13px]" style={{ color: T.muted }}>
          Last updated {BRAND.legalUpdated} · Operated by {BRAND.operator}
        </p>
        <p className="mt-6 text-[17px] leading-7" style={{ color: T.muted }}>
          {intro}
        </p>
        <div className="legal mt-8 flex flex-col gap-7 text-[15px] leading-7">{children}</div>
        <style>{`
          .legal h2 { font-size: 22px; line-height: 1.2; font-weight: 700; margin-bottom: 8px; }
          .legal ul { list-style: disc; padding-left: 22px; display: flex; flex-direction: column; gap: 6px; }
          .legal a { color: ${T.deep}; text-decoration: underline; text-underline-offset: 3px; }
          .legal table { border-collapse: collapse; width: 100%; font-size: 14px; }
          .legal th, .legal td { text-align: left; vertical-align: top; padding: 8px 10px; border-bottom: 1px solid ${T.line}; }
          .legal th { color: ${T.muted}; font-weight: 600; }
        `}</style>
      </main>
      <footer className="border-t" style={{ borderColor: T.line }}>
        <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-5 py-8 text-[13px]" style={{ color: T.muted }}>
          <span>
            © {new Date().getFullYear()} {BRAND.operator}
          </span>
          <span className="flex gap-5">
            <Link href={BRAND.privacyPath} style={{ color: T.ink }} className="font-semibold">
              Privacy
            </Link>
            <Link href={BRAND.termsPath} style={{ color: T.ink }} className="font-semibold">
              Terms
            </Link>
            <a href={`mailto:${BRAND.email}`} style={{ color: T.ink }} className="font-semibold">
              {BRAND.email}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
