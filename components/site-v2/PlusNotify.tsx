"use client";

import { useState } from "react";
import { btnInner } from "@/components/site-v2/ui";

/**
 * 「Coming soon · Plus」的一行登记（极次要）。默认收起，只有一个「Notify me」文字按钮；点开才出现邮箱输入。
 * 走应用已有的 /api/signup。接口在 KV 未配置或写入失败时会返回 HTTP 200 + { ok: true, stored: false }，所以只看 HTTP 状态不够：
 * 只有 JSON 明确 ok && stored 才算登记成功；stored:false、非 2xx、非 JSON、网络错误都保留输入并允许重试。
 */
export function PlusNotify({ appUrl }: { appUrl: string }) {
  const base = appUrl.replace(/\/$/, "");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch(`${base}/api/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, lang: "en" }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { ok?: unknown; stored?: unknown };
      if (data.ok !== true || data.stored !== true) throw new Error("not stored");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p className="text-[13px] font-semibold text-(--v2-accent)">You&rsquo;re on the list. We&rsquo;ll write when Plus opens.</p>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="group/btn inline-flex h-9 shrink-0 touch-manipulation items-center rounded-full border border-(--v2-line) bg-(--v2-surface) px-3.5 text-[13px] font-semibold text-(--v2-ink) transition-colors duration-150 fine:hover:bg-(--v2-surface2) motion-reduce:transition-none">
        <span className={btnInner}>Notify me</span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-[380px] flex-wrap items-center gap-2">
      <input type="email" required autoFocus aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-9 min-w-0 flex-1 rounded-full border border-(--v2-line) bg-(--v2-surface) px-4 text-[14px] text-(--v2-ink) outline-none placeholder:text-(--v2-faint)" />
      <button type="submit" disabled={state === "sending"} className="group/btn inline-flex h-9 shrink-0 touch-manipulation items-center rounded-full border border-(--v2-line) bg-(--v2-surface) px-3.5 text-[13px] font-semibold text-(--v2-ink) transition-colors duration-150 fine:hover:bg-(--v2-surface2) disabled:opacity-60 motion-reduce:transition-none">
        <span className={btnInner}>{state === "sending" ? "Sending…" : state === "error" ? "Try again" : "Notify me"}</span>
      </button>
      {state === "error" && (
        <span role="status" className="basis-full text-[12px] text-(--v2-muted)">
          We couldn&rsquo;t save that just now. Your address is still here, try again in a moment.
        </span>
      )}
    </form>
  );
}
