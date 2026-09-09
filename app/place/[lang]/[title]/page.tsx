import { redirect } from "next/navigation";

/** 旧地址 /place/en/Eiffel_Tower → 新地址 /p/en/wp:Eiffel_Tower */
export default async function LegacyPlacePage({ params }: { params: Promise<{ lang: string; title: string }> }) {
  const { lang, title } = await params;
  redirect(`/p/${lang}/${encodeURIComponent(`wp:${decodeURIComponent(title)}`)}`);
}
