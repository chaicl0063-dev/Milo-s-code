import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlaceDetail } from "@/lib/places/detail";
import { categoryLabel, isLang } from "@/lib/i18n";
import { llmConfigured } from "@/lib/guide";
import { asrConfigured } from "@/lib/asr";
import { TalkScreen } from "@/components/TalkScreen";

type Params = Promise<{ lang: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang)) return {};
  const place = await getPlaceDetail(lang, decodeURIComponent(id)).catch(() => null);
  return place ? { title: `${place.title} · ReAround You` } : {};
}

/** 和导游聊这个地点：/p/[lang]/[id]/talk */
export default async function TalkPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  if (!isLang(lang) || !llmConfigured()) notFound();
  const placeId = decodeURIComponent(id);
  const place = await getPlaceDetail(lang, placeId);
  if (!place) notFound();
  const subtitle = place.description || (place.category ? categoryLabel(lang, place.category) : undefined);
  return <TalkScreen lang={lang} placeId={place.id} title={place.title} subtitle={subtitle} thumbnail={place.image?.source} asrEnabled={asrConfigured()} />;
}
