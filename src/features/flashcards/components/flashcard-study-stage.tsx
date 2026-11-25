"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Star,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWordSpeech } from "@/features/pronunciation/hooks/use-word-speech";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import {
  filterDeckCards,
  getCardStatus,
  isCardStarred,
  shuffleCards,
} from "../storage";
import type {
  CardFilter,
  CardMastery,
  CardProgressRecord,
  FlashcardItem,
} from "../types";

const FILTER_OPTIONS: readonly { key: CardFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unmastered", label: "Unmastered" },
  { key: "review", label: "Needs review" },
  { key: "mastered", label: "Mastered" },
  { key: "starred", label: "Starred" },
];

const STATUS_META: Record<CardMastery, { label: string; chipClass: string }> = {
  new: { label: "Not studied", chipClass: "sp-chip sp-chip-neutral" },
  learning: { label: "Still learning", chipClass: "sp-chip sp-chip-danger" },
  review: { label: "Needs review", chipClass: "sp-chip sp-chip-warning" },
  mastered: { label: "Mastered", chipClass: "sp-chip sp-chip-success" },
};

export function FlashcardStudyStage({
  cards,
  progress,
  onRateCard,
  onToggleStar,
}: {
  cards: readonly FlashcardItem[];
  progress: Record<string, CardProgressRecord>;
  onRateCard: (cardId: string, status: CardMastery) => void;
  onToggleStar: (cardId: string) => void;
}) {
  const { supported: speechSupported, speak } = useWordSpeech();
  const [filter, setFilter] = useState<CardFilter>("all");
  const [isShuffled, setIsShuffled] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    cards.map((card) => card.id),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    learning: 0,
    review: 0,
    mastered: 0,
  });

  const filteredCards = useMemo(
    () => filterDeckCards(cards, progress, filter),
    [cards, progress, filter],
  );

  const studyCards = useMemo(() => {
    const byId = new Map(filteredCards.map((card) => [card.id, card]));
    if (!isShuffled) return filteredCards;
    const ordered: FlashcardItem[] = [];
    for (const id of orderedIds) {
      const found = byId.get(id);
      if (found) ordered.push(found);
    }
    for (const card of filteredCards) {
      if (!ordered.some((item) => item.id === card.id)) {
        ordered.push(card);
      }
    }
    return ordered;
  }, [filteredCards, isShuffled, orderedIds]);

  const safeIndex =
    studyCards.length === 0 ? 0 : Math.min(currentIndex, studyCards.length - 1);
  const activeCard = studyCards[safeIndex] ?? null;

  const handleFilterChange = (nextFilter: CardFilter) => {
    setFilter(nextFilter);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionDone(false);
  };

  const handleToggleShuffle = () => {
    if (isShuffled) {
      setIsShuffled(false);
      setOrderedIds(cards.map((card) => card.id));
    } else {
      setIsShuffled(true);
      setOrderedIds(shuffleCards(cards).map((card) => card.id));
    }
    setCurrentIndex(0);
    setFlipped(false);
    setSessionDone(false);
  };

  const goPrev = useCallback(() => {
    if (studyCards.length === 0) return;
    setSessionDone(false);
    setFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : studyCards.length - 1));
  }, [studyCards.length]);

  const goNext = useCallback(() => {
    if (studyCards.length === 0) return;
    setFlipped(false);
    if (safeIndex + 1 >= studyCards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(safeIndex + 1);
    }
  }, [safeIndex, studyCards.length]);

  const handleRate = useCallback(
    (status: CardMastery) => {
      if (!activeCard) return;
      onRateCard(activeCard.id, status);
      setSessionStats((prev) => ({
        learning: prev.learning + (status === "learning" ? 1 : 0),
        review: prev.review + (status === "review" ? 1 : 0),
        mastered: prev.mastered + (status === "mastered" ? 1 : 0),
      }));
      setFlipped(false);
      if (safeIndex + 1 >= studyCards.length) {
        setSessionDone(true);
      } else {
        setCurrentIndex(safeIndex + 1);
      }
    },
    [activeCard, onRateCard, safeIndex, studyCards.length],
  );

  const restartSession = (nextFilter?: CardFilter) => {
    if (nextFilter) setFilter(nextFilter);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionDone(false);
    setSessionStats({ learning: 0, review: 0, mastered: 0 });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (sessionDone || !activeCard) return;

      if (event.code === "Space") {
        event.preventDefault();
        setFlipped((prev) => !prev);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "1") {
        event.preventDefault();
        handleRate("learning");
      } else if (event.key === "2") {
        event.preventDefault();
        handleRate("review");
      } else if (event.key === "3") {
        event.preventDefault();
        handleRate("mastered");
      } else if ((event.key === "s" || event.key === "S") && speechSupported) {
        event.preventDefault();
        speak(activeCard.term);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeCard,
    goNext,
    goPrev,
    handleRate,
    sessionDone,
    speak,
    speechSupported,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <fieldset className="flex flex-wrap gap-1.5 border-0 p-0">
          <legend className="sr-only">Filter cards by status</legend>
          {FILTER_OPTIONS.map((option) => {
            const active = filter === option.key;
            return (
              <button
                aria-pressed={active}
                className={`min-h-9 cursor-pointer rounded-full border px-3.5 text-xs font-semibold transition ${focusRing} ${
                  active
                    ? "border-[var(--tm-brand)] bg-[var(--tm-brand-soft)] text-[var(--tm-brand)]"
                    : "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-ink-muted)] hover:border-[var(--tm-border-strong)] hover:text-[var(--tm-ink)]"
                }`}
                key={option.key}
                onClick={() => handleFilterChange(option.key)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </fieldset>

        <div className="flex items-center gap-2">
          <button
            aria-pressed={isShuffled}
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${focusRing} ${
              isShuffled
                ? "border-[var(--tm-brand)] bg-[var(--tm-brand-soft)] text-[var(--tm-brand)]"
                : "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-ink-muted)] hover:border-[var(--tm-border-strong)] hover:text-[var(--tm-ink)]"
            }`}
            onClick={handleToggleShuffle}
            type="button"
          >
            <Shuffle aria-hidden="true" className="size-3.5" />
            {isShuffled ? "Shuffled" : "Shuffle"}
          </button>
          <span className="sp-mono rounded-lg bg-[var(--tm-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--tm-ink-muted)]">
            {studyCards.length === 0
              ? "0 / 0"
              : `${safeIndex + 1} / ${studyCards.length}`}
          </span>
        </div>
      </div>

      {studyCards.length === 0 ? (
        <div className="rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-page)] px-6 py-12 text-center">
          <p className="text-base font-semibold text-[var(--tm-ink)]">
            No cards match this filter
          </p>
          <p className="mt-1.5 text-sm text-[var(--tm-ink-muted)]">
            Switch back to &ldquo;All&rdquo; to continue reviewing every word in
            this deck.
          </p>
          <button
            className={`${secondaryAction} mt-5`}
            onClick={() => handleFilterChange("all")}
            type="button"
          >
            Show all cards
          </button>
        </div>
      ) : sessionDone ? (
        <div className="rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-brand-soft)] px-6 py-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--tm-success-soft)] text-[var(--tm-success)]">
            <CheckCircle2 aria-hidden="true" className="size-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--tm-ink)]">
            Review session complete!
          </h2>
          <p className="mt-1.5 text-sm text-[var(--tm-ink-muted)]">
            You just reviewed {studyCards.length} cards in this session.
          </p>
          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl border border-[var(--tm-success)]/30 bg-[var(--tm-success-soft)] p-3">
              <p className="sp-mono text-2xl font-bold text-[var(--tm-success)]">
                {sessionStats.mastered}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--tm-success)]">
                Mastered
              </p>
            </div>
            <div className="rounded-xl border border-[var(--tm-warning)]/30 bg-[var(--tm-warning-soft)] p-3">
              <p className="sp-mono text-2xl font-bold text-[var(--tm-warning)]">
                {sessionStats.review}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--tm-warning)]">
                Needs review
              </p>
            </div>
            <div className="rounded-xl border border-[var(--tm-danger)]/30 bg-[var(--tm-danger-soft)] p-3">
              <p className="sp-mono text-2xl font-bold text-[var(--tm-danger)]">
                {sessionStats.learning}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--tm-danger)]">
                Still learning
              </p>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              className={primaryAction}
              onClick={() => restartSession("unmastered")}
              type="button"
            >
              Review unmastered cards
            </button>
            <button
              className={secondaryAction}
              onClick={() => restartSession("all")}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Study again from start
            </button>
          </div>
        </div>
      ) : activeCard ? (
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--tm-border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#cc2f20] to-[#e36a22] transition-[width] duration-300"
              style={{
                width: `${Math.round(((safeIndex + 1) / studyCards.length) * 100)}%`,
              }}
            />
          </div>

          <div className="fc-scene">
            <div
              className={`fc-card ${flipped ? "fc-card-flipped" : ""}`}
              data-flipped={flipped ? "true" : "false"}
            >
              {/* Front face */}
              <div
                aria-hidden={flipped}
                className="fc-face rounded-[20px] border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] p-6 shadow-[0_12px_32px_-16px_rgb(62_44_30/0.16)] md:p-8"
                inert={flipped || undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        STATUS_META[getCardStatus(progress, activeCard.id)]
                          .chipClass
                      }
                    >
                      {
                        STATUS_META[getCardStatus(progress, activeCard.id)]
                          .label
                      }
                    </span>
                    <span className="sp-chip sp-chip-orange">
                      {activeCard.toeicPart}
                    </span>
                    <span className="sp-chip sp-chip-neutral">
                      {activeCard.level}
                    </span>
                  </div>

                  <button
                    aria-label={
                      isCardStarred(progress, activeCard.id)
                        ? "Remove star"
                        : "Star important card"
                    }
                    aria-pressed={isCardStarred(progress, activeCard.id)}
                    className={`grid size-9 cursor-pointer place-items-center rounded-lg border transition ${focusRing} ${
                      isCardStarred(progress, activeCard.id)
                        ? "border-[var(--tm-warning)]/50 bg-[var(--tm-warning-soft)] text-[var(--tm-warning)]"
                        : "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-ink-muted)] hover:border-[var(--tm-border-strong)] hover:text-[var(--tm-ink)]"
                    }`}
                    onClick={() => onToggleStar(activeCard.id)}
                    type="button"
                  >
                    <Star
                      aria-hidden="true"
                      className="size-4"
                      fill={
                        isCardStarred(progress, activeCard.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>

                <div className="my-auto flex flex-col items-center py-6 text-center">
                  <button
                    aria-label={`Flip card to see meaning of ${activeCard.term}`}
                    className={`flex w-full cursor-pointer flex-col items-center rounded-xl py-3 text-center transition hover:bg-[var(--tm-page)]/80 ${focusRing}`}
                    onClick={() => setFlipped(true)}
                    type="button"
                  >
                    <span className="text-sm font-medium italic text-[var(--tm-ink-muted)]">
                      {activeCard.partOfSpeech}
                    </span>
                    <span className="mt-2 text-3xl font-bold tracking-tight text-[var(--tm-ink)] sm:text-4xl">
                      {activeCard.term}
                    </span>
                    {activeCard.phonetic && (
                      <span className="sp-mono mt-2.5 text-base text-[var(--tm-ink-muted)]">
                        {activeCard.phonetic}
                      </span>
                    )}
                  </button>

                  {speechSupported && (
                    <button
                      aria-label={`Listen to pronunciation of ${activeCard.term}`}
                      className={`mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--tm-border-strong)] bg-[var(--tm-page)] px-4 text-sm font-semibold text-[var(--tm-ink)] transition hover:border-[var(--tm-brand)] hover:bg-[var(--tm-brand-soft)] hover:text-[var(--tm-brand)] ${focusRing}`}
                      onClick={() => speak(activeCard.term)}
                      type="button"
                    >
                      <Volume2 aria-hidden="true" className="size-4" />
                      Pronounce (S)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--tm-border)] pt-4 text-xs text-[var(--tm-ink-muted)]">
                  <span>Click the card or press Space to see the meaning</span>
                  <button
                    className={`cursor-pointer font-semibold text-[var(--tm-brand)] hover:underline ${focusRing}`}
                    onClick={() => setFlipped(true)}
                    type="button"
                  >
                    Flip card →
                  </button>
                </div>
              </div>

              {/* Back face */}
              <div
                aria-hidden={!flipped}
                className="fc-face fc-face-back rounded-[20px] border border-[#e9c6a4] bg-[var(--tm-brand-soft)] p-6 shadow-[0_12px_32px_-16px_rgb(204_47_32/0.16)] md:p-8"
                inert={!flipped || undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-[var(--tm-ink)]">
                      {activeCard.term}
                    </span>
                    <span className="text-xs italic text-[var(--tm-ink-muted)]">
                      ({activeCard.partOfSpeech})
                    </span>
                  </div>
                  <button
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--tm-ink-muted)] transition hover:bg-[var(--tm-surface)]/80 hover:text-[var(--tm-ink)] ${focusRing}`}
                    onClick={() => setFlipped(false)}
                    type="button"
                  >
                    ← Front
                  </button>
                </div>

                <div className="my-auto space-y-5 py-5">
                  <div>
                    <p className="text-xs font-semibold text-[var(--tm-ink-muted)]">
                      TOEIC context meaning
                    </p>
                    <p
                      className="mt-1 text-2xl font-bold leading-snug text-[var(--tm-ink)]"
                      lang="vi"
                    >
                      {activeCard.meaningVi}
                    </p>
                  </div>

                  {activeCard.exampleEn && (
                    <div className="rounded-xl border border-[#e9c6a4]/70 bg-[var(--tm-surface)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[15px] font-medium leading-relaxed text-[var(--tm-ink)]">
                          “{activeCard.exampleEn}”
                        </p>
                        {speechSupported && (
                          <button
                            aria-label="Listen to example sentence"
                            className={`grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-[var(--tm-border)] text-[var(--tm-ink-muted)] transition hover:border-[var(--tm-brand)] hover:text-[var(--tm-brand)] ${focusRing}`}
                            onClick={() => speak(activeCard.exampleEn)}
                            type="button"
                          >
                            <Volume2 aria-hidden="true" className="size-4" />
                          </button>
                        )}
                      </div>
                      {activeCard.exampleVi && (
                        <p
                          className="mt-2 text-sm text-[var(--tm-ink-muted)]"
                          lang="vi"
                        >
                          {activeCard.exampleVi}
                        </p>
                      )}
                    </div>
                  )}

                  {activeCard.collocations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--tm-ink-muted)]">
                        Common exam collocations
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activeCard.collocations.map((collocation) => (
                          <span
                            className="rounded-lg border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-2.5 py-1 text-xs font-medium text-[var(--tm-ink)]"
                            key={collocation}
                          >
                            {collocation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#e9c6a4]/70 pt-3 text-xs text-[var(--tm-ink-muted)]">
                  Rate your recall below (keys 1, 2, 3) to advance
                </div>
              </div>
            </div>
          </div>

          {/* Mastery rating + prev/next controls */}
          <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <button
              aria-label="Previous card"
              className={`${secondaryAction} px-3.5`}
              onClick={goPrev}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              <span className="sm:hidden">Prev</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border border-[var(--tm-danger)]/35 bg-[var(--tm-danger-soft)] px-2 py-1.5 text-center transition hover:brightness-95 ${focusRing}`}
                onClick={() => handleRate("learning")}
                type="button"
              >
                <span className="text-sm font-bold text-[var(--tm-danger)]">
                  Still learning
                </span>
                <span className="sp-mono text-[11px] text-[var(--tm-danger)]">
                  Key 1
                </span>
              </button>

              <button
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border border-[var(--tm-warning)]/35 bg-[var(--tm-warning-soft)] px-2 py-1.5 text-center transition hover:brightness-95 ${focusRing}`}
                onClick={() => handleRate("review")}
                type="button"
              >
                <span className="text-sm font-bold text-[var(--tm-warning)]">
                  Needs review
                </span>
                <span className="sp-mono text-[11px] text-[var(--tm-warning)]">
                  Key 2
                </span>
              </button>

              <button
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border border-[var(--tm-success)]/35 bg-[var(--tm-success-soft)] px-2 py-1.5 text-center transition hover:brightness-95 ${focusRing}`}
                onClick={() => handleRate("mastered")}
                type="button"
              >
                <span className="text-sm font-bold text-[var(--tm-success)]">
                  Mastered
                </span>
                <span className="sp-mono text-[11px] text-[var(--tm-success)]">
                  Key 3
                </span>
              </button>
            </div>

            <button
              aria-label="Next card"
              className={`${secondaryAction} px-3.5`}
              onClick={goNext}
              type="button"
            >
              <span className="sm:hidden">Next</span>
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
