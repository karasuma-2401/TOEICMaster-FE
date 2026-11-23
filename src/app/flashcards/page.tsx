import type { Metadata } from "next";
import { FlashcardsHeader } from "@/features/flashcards/components/flashcards-header";
import { FlashcardsWorkspace } from "@/features/flashcards/components/flashcards-workspace";
import { Breadcrumbs } from "@/shared/components/practice/breadcrumbs";
import { wideContainer } from "@/shared/components/practice/styles";

export const metadata: Metadata = {
  title: "TOEIC Vocabulary Flashcards | TOEICMaster",
  description:
    "Learn and review TOEIC vocabulary by topic with 3D flip cards, standard pronunciation, and quick quizzes.",
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
      <main
        className={`${wideContainer} pb-12 pt-6`}
        id="main-content"
        tabIndex={-1}
      >
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Flashcards" }]}
        />
        <FlashcardsWorkspace initialDeckSlug={deck} />
      </main>
    </div>
  );
}
