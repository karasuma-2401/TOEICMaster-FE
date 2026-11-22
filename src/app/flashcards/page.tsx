import type { Metadata } from "next";
import { FlashcardsHeader } from "@/features/flashcards/components/flashcards-header";
import { FlashcardsWorkspace } from "@/features/flashcards/components/flashcards-workspace";
import { Breadcrumbs } from "@/shared/components/practice/breadcrumbs";
import { wideContainer } from "@/shared/components/practice/styles";

export const metadata: Metadata = {
  title: "Flashcards Từ Vựng TOEIC | TOEICMaster",
  description:
    "Học và ôn tập từ vựng TOEIC theo chủ đề bằng thẻ lật 3D, phát âm chuẩn và trắc nghiệm nhanh.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const deck = first(params.deck) ?? null;

  return (
    <div className="sp-theme min-h-dvh bg-white">
      <FlashcardsHeader />
      <main className={`${wideContainer} pb-12 pt-6`}>
        <Breadcrumbs
          items={[{ label: "Trang chủ", href: "/" }, { label: "Flashcards" }]}
        />
        <FlashcardsWorkspace initialDeckSlug={deck} />
      </main>
    </div>
  );
}
