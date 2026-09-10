"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Place } from "@/lib/places/types";
import { t, type GuideLang, type Lang } from "@/lib/i18n";
import { placeHref } from "@/lib/links";
import { CameraIcon, SparkIcon } from "@/components/Icons";

interface Props {
  lang: Lang;
  guideLang: GuideLang;
  candidates: Place[];
  /** 没匹配上周边地点时，用识别出的名字去搜 */
  onSearchName: (name: string) => void;
  className?: string;
}

interface IdentifyResult {
  name: string | null;
  kind: string;
  confidence: number | null;
  brief: string;
  matchId: string | null;
  matchTitle: string | null;
}

/** 把照片压到最长边 1024，JPEG 0.8，避免上传几 MB 的原图 */
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

/** 地图右下角的相机按钮 + 识别结果弹层 */
export function PhotoIdentify({ lang, guideLang, candidates, onSearchName, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "identifying" | "done" | "error">("idle");
  const [result, setResult] = useState<IdentifyResult | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus("identifying");
    setResult(null);
    try {
      const dataUrl = await compress(file);
      setPhoto(dataUrl);
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, lang: guideLang, candidates: candidates.map((p) => ({ id: p.id, title: p.title })) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult((await res.json()) as IdentifyResult);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function close() {
    setPhoto(null);
    setResult(null);
    setStatus("idle");
  }

  const open = status !== "idle";
  const matchedPlace = result?.matchId ? candidates.find((p) => p.id === result.matchId) : undefined;

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={t(lang, "identifyPhoto")}
        aria-label={t(lang, "identifyPhoto")}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_6px_16px_rgba(27,31,29,0.14)] ${className}`}
      >
        <CameraIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-ink/40 p-4" onClick={close}>
          <div
            className="flex w-full max-w-[480px] flex-col gap-4 rounded-[24px] bg-surface p-5 shadow-[0_-10px_30px_rgba(27,31,29,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {photo && (
              <div className="h-44 w-full overflow-hidden rounded-[18px] bg-surface-2">
                {/* 本地照片预览 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="h-full w-full object-cover" />
              </div>
            )}

            {status === "identifying" && (
              <p className="flex items-center gap-2 text-[15px] text-muted">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
                {t(lang, "identifying")}
              </p>
            )}

            {status === "error" && <p className="text-[15px] leading-6 text-ink-soft">{t(lang, "identifyFailed")}</p>}

            {status === "done" && result && (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-accent">
                  <SparkIcon size={14} />
                  {result.kind || t(lang, "identifyPhoto")}
                </p>
                {result.name ? (
                  <h2 className="font-serif text-[30px] leading-9">
                    {result.confidence !== null && result.confidence < 0.5 && (
                      <span className="mr-2 text-[14px] font-sans text-muted">{t(lang, "identifyUnsure")}</span>
                    )}
                    {matchedPlace?.title ?? result.name}
                  </h2>
                ) : (
                  <p className="text-[15px] leading-6 text-ink-soft">{t(lang, "identifyFailed")}</p>
                )}
                {result.brief && <p className="text-[15px] leading-6 text-ink-soft">{result.brief}</p>}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {status === "done" && matchedPlace && (
                <Link href={placeHref(lang, matchedPlace.id)} className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-bold text-bg">
                  {t(lang, "viewPlace")}
                </Link>
              )}
              {status === "done" && !matchedPlace && result?.name && (
                <button
                  type="button"
                  onClick={() => {
                    const name = result.name!;
                    close();
                    onSearchName(name);
                  }}
                  className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-bold text-bg"
                >
                  {t(lang, "searchName")}
                </button>
              )}
              {status !== "identifying" && (
                <button type="button" onClick={() => inputRef.current?.click()} className="h-11 rounded-full border border-line px-4 text-[14px] font-semibold text-ink">
                  {t(lang, "retake")}
                </button>
              )}
              <button type="button" onClick={close} className="ml-auto h-11 px-3 text-[14px] font-semibold text-faint">
                {t(lang, "dismiss")}
              </button>
            </div>
            <p className="text-[11px] text-faint">{t(lang, "photoPrivacy")}</p>
          </div>
        </div>
      )}
    </>
  );
}
