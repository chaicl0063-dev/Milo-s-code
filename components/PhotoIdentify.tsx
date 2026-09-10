"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Place } from "@/lib/places/types";
import { t, type GuideLang, type Lang } from "@/lib/i18n";
import { placeHref } from "@/lib/links";
import { CameraIcon, SparkIcon } from "@/components/Icons";

export type PhotoMode = "identify" | "translate";

interface Props {
  lang: Lang;
  guideLang: GuideLang;
  candidates: Place[];
  /** 没匹配上周边地点时，用识别出的名字去搜 */
  onSearchName: (name: string) => void;
  className?: string;
  /** 打开时默认的模式：认地点 / 翻译文字 */
  defaultMode?: PhotoMode;
  /** 自定义触发按钮；不传就是地图右下角的相机圆钮 */
  trigger?: (open: () => void) => ReactNode;
}

interface IdentifyResult {
  name: string | null;
  kind: string;
  confidence: number | null;
  brief: string;
  matchId: string | null;
  matchTitle: string | null;
}

interface TranslateResult {
  original: string;
  translation: string;
  note: string;
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

/** 相机按钮 + 结果弹层。两种模式：这是什么（认地点）、翻译文字（路牌菜单展签） */
export function PhotoIdentify({ lang, guideLang, candidates, onSearchName, className = "", defaultMode = "identify", trigger }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<PhotoMode>(defaultMode);
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [translated, setTranslated] = useState<TranslateResult | null>(null);

  async function submit(dataUrl: string, m: PhotoMode) {
    setStatus("working");
    setResult(null);
    setTranslated(null);
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          lang: guideLang,
          mode: m,
          candidates: m === "identify" ? candidates.map((p) => ({ id: p.id, title: p.title })) : [],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (m === "translate") setTranslated(data as TranslateResult);
      else setResult(data as IdentifyResult);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus("working");
    const dataUrl = await compress(file);
    setPhoto(dataUrl);
    await submit(dataUrl, mode);
  }

  function switchMode(m: PhotoMode) {
    if (m === mode) return;
    setMode(m);
    if (photo && status !== "working") void submit(photo, m);
  }

  function close() {
    setPhoto(null);
    setResult(null);
    setTranslated(null);
    setStatus("idle");
    setMode(defaultMode);
  }

  // 打开系统相机：先记一次「要打开」，在 effect 里点隐藏的 input（渲染期不碰 ref，lint 才放行）
  const [openTick, setOpenTick] = useState(0);
  useEffect(() => {
    if (openTick > 0) inputRef.current?.click();
  }, [openTick]);
  const openPicker = useCallback(() => setOpenTick((n) => n + 1), []);
  const open = status !== "idle";
  const matchedPlace = result?.matchId ? candidates.find((p) => p.id === result.matchId) : undefined;

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      {trigger ? (
        trigger(openPicker)
      ) : (
        <button
          type="button"
          onClick={openPicker}
          title={t(lang, "identifyPhoto")}
          aria-label={t(lang, "identifyPhoto")}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_6px_16px_rgba(27,31,29,0.14)] ${className}`}
        >
          <CameraIcon />
        </button>
      )}

      {/* 用 portal 挂到 body 上，不然会被地图按钮容器的层级压在 tab 栏下面 */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-ink/40 p-4" onClick={close}>
            <div className="flex w-full max-w-[480px] flex-col gap-4 rounded-[24px] bg-surface p-5 shadow-[0_-10px_30px_rgba(27,31,29,0.2)]" onClick={(e) => e.stopPropagation()}>
              {/* 模式切换 */}
              <div className="flex gap-2">
                {(["identify", "translate"] as PhotoMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    aria-pressed={mode === m}
                    className={`h-9 rounded-full px-4 text-[13px] font-semibold ${mode === m ? "bg-ink text-bg" : "border border-line bg-surface text-ink"}`}
                  >
                    {t(lang, m === "identify" ? "modeIdentify" : "modeTranslate")}
                  </button>
                ))}
              </div>

              {photo && (
                <div className="h-44 w-full overflow-hidden rounded-[18px] bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </div>
              )}

              {status === "working" && (
                <p className="flex items-center gap-2 text-[15px] text-muted">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
                  {t(lang, mode === "translate" ? "translating" : "identifying")}
                </p>
              )}

              {status === "error" && <p className="text-[15px] leading-6 text-ink-soft">{t(lang, mode === "translate" ? "translateFailed" : "identifyFailed")}</p>}

              {status === "done" && mode === "identify" && result && (
                <div className="flex flex-col gap-2">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-accent">
                    <SparkIcon size={14} />
                    {result.kind || t(lang, "identifyPhoto")}
                  </p>
                  {result.name ? (
                    <h2 className="font-serif text-[30px] leading-9">
                      {result.confidence !== null && result.confidence < 0.5 && <span className="mr-2 font-sans text-[14px] text-muted">{t(lang, "identifyUnsure")}</span>}
                      {matchedPlace?.title ?? result.name}
                    </h2>
                  ) : (
                    <p className="text-[15px] leading-6 text-ink-soft">{t(lang, "identifyFailed")}</p>
                  )}
                  {result.brief && <p className="text-[15px] leading-6 text-ink-soft">{result.brief}</p>}
                </div>
              )}

              {status === "done" && mode === "translate" && translated && (
                <div className="flex flex-col gap-3">
                  {translated.translation ? (
                    <>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{t(lang, "translation")}</p>
                        <p className="mt-1 whitespace-pre-wrap text-[17px] leading-7 text-ink">{translated.translation}</p>
                      </div>
                      {translated.original && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{t(lang, "original")}</p>
                          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-muted">{translated.original}</p>
                        </div>
                      )}
                      {translated.note && <p className="text-[13px] leading-5 text-ink-soft">{translated.note}</p>}
                    </>
                  ) : (
                    <p className="text-[15px] leading-6 text-ink-soft">{t(lang, "translateFailed")}</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {status === "done" && mode === "identify" && matchedPlace && (
                  <Link href={placeHref(lang, matchedPlace.id)} className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-bold text-bg">
                    {t(lang, "viewPlace")}
                  </Link>
                )}
                {status === "done" && mode === "identify" && !matchedPlace && result?.name && (
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
                {status !== "working" && (
                  <button type="button" onClick={openPicker} className="h-11 rounded-full border border-line px-4 text-[14px] font-semibold text-ink">
                    {t(lang, "retake")}
                  </button>
                )}
                <button type="button" onClick={close} className="ml-auto h-11 px-3 text-[14px] font-semibold text-faint">
                  {t(lang, "dismiss")}
                </button>
              </div>
              <p className="text-[11px] text-faint">{t(lang, "photoPrivacy")}</p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
