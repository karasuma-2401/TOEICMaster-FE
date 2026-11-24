"use client";

import { CheckCircle2, RotateCcw, Volume2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useWordSpeech } from "@/features/pronunciation/hooks/use-word-speech";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { buildQuizQuestions } from "../storage";
import type { CardMastery, FlashcardItem } from "../types";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export function FlashcardQuizMode({
  cards,
  distractorPool,
  onRateCard,
}: {
  cards: readonly FlashcardItem[];
  distractorPool: readonly FlashcardItem[];
  onRateCard: (cardId: string, status: CardMastery) => void;
}) {
  const { supported: speechSupported, speak } = useWordSpeech();
  const [round, setRound] = useState(0);
  const questions = useMemo(
    () => buildQuizQuestions(cards, distractorPool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, distractorPool, round],
  );
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[index];
  const selectedOption = currentQuestion?.options.find(
    (option) => option.id === selectedId,
  );
  const feedbackAnnouncement = selectedOption
    ? selectedOption.isCorrect
      ? `Correct! ${currentQuestion.card.term} means ${currentQuestion.card.meaningVi}.`
      : `Incorrect. ${currentQuestion.card.term} means ${currentQuestion.card.meaningVi}.`
    : "";

  const handleSelect = (optionId: string, isCorrect: boolean) => {
    if (selectedId || !currentQuestion) return;
    setSelectedId(optionId);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      onRateCard(currentQuestion.card.id, "mastered");
    } else {
      onRateCard(currentQuestion.card.id, "review");
    }
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex((prev) => prev + 1);
      setSelectedId(null);
    }
  };

  const handleRestart = () => {
    setRound((prev) => prev + 1);
    setIndex(0);
    setSelectedId(null);
    setCorrectCount(0);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-page)] px-6 py-12 text-center">
        <p className="text-base font-semibold text-[var(--tm-ink)]">
          This deck has no cards yet to create a quiz
        </p>
      </div>
    );
  }

  if (finished) {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-brand-soft)] px-6 py-10 text-center">
        <p className="sp-mono text-4xl font-bold text-[var(--tm-brand)]">
          {correctCount} / {questions.length}
        </p>
        <h2 className="mt-2 text-xl font-bold text-[var(--tm-ink)]">
          Accuracy {accuracy}%
        </h2>
        <p className="mt-1.5 text-sm text-[var(--tm-ink-muted)]">
          Correct answers have been marked as &ldquo;Mastered&rdquo;, and missed
          ones were moved to &ldquo;Needs review&rdquo; for further practice.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            className={primaryAction}
            onClick={handleRestart}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Start a new quiz round
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div aria-live="polite" className="sr-only">
        {feedbackAnnouncement}
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-[var(--tm-ink-muted)]">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span className="sp-mono">Correct: {correctCount}</span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--tm-border)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#cc2f20] to-[#e36a22] transition-[width] duration-300"
          style={{
            width: `${Math.round(((index + 1) / questions.length) * 100)}%`,
          }}
        />
      </div>

      <div className="rounded-[20px] border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="sp-chip sp-chip-orange">
              {currentQuestion.card.toeicPart}
            </span>
            <span className="text-xs italic text-[var(--tm-ink-muted)]">
              {currentQuestion.card.partOfSpeech}
            </span>
          </div>
          {speechSupported && (
            <button
              aria-label={`Listen to pronunciation of ${currentQuestion.card.term}`}
              className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--tm-border-strong)] bg-[var(--tm-page)] px-3 text-xs font-semibold text-[var(--tm-ink)] transition hover:border-[var(--tm-brand)] hover:text-[var(--tm-brand)] ${focusRing}`}
              onClick={() => speak(currentQuestion.card.term)}
              type="button"
            >
              <Volume2 aria-hidden="true" className="size-3.5" />
              Listen
            </button>
          )}
        </div>

        <div className="mt-5">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--tm-ink)]">
            {currentQuestion.card.term}
          </h2>
          {currentQuestion.card.phonetic && (
            <p className="sp-mono mt-1 text-sm text-[var(--tm-ink-muted)]">
              {currentQuestion.card.phonetic}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option, optionIdx) => {
            const isSelected = selectedId === option.id;
            const answered = selectedId !== null;
            let stateClasses =
              "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-ink)] hover:border-[var(--tm-brand)] hover:bg-[var(--tm-brand-soft)]";
            if (answered) {
              if (option.isCorrect) {
                stateClasses =
                  "border-[var(--tm-success)] bg-[var(--tm-success-soft)] text-[var(--tm-success)] font-semibold";
              } else if (isSelected) {
                stateClasses =
                  "border-[var(--tm-danger)] bg-[var(--tm-danger-soft)] text-[var(--tm-danger)] font-semibold";
              } else {
                stateClasses =
                  "border-[var(--tm-border)] bg-[var(--tm-page)] text-[var(--tm-ink-muted)] opacity-80";
              }
            }

            return (
              <button
                className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-4 text-left text-sm transition disabled:cursor-default ${focusRing} ${stateClasses}`}
                disabled={answered}
                key={option.id}
                onClick={() => handleSelect(option.id, option.isCorrect)}
                type="button"
              >
                <span className="sp-mono grid size-6 shrink-0 place-items-center rounded-md bg-black/5 text-xs font-bold">
                  {OPTION_LABELS[optionIdx] ?? optionIdx + 1}
                </span>
                <span className="flex-1 leading-snug" lang="vi">
                  {option.meaningVi}
                </span>
                {answered && option.isCorrect && (
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-4 shrink-0 text-[var(--tm-success)]"
                  />
                )}
                {answered && isSelected && !option.isCorrect && (
                  <XCircle
                    aria-hidden="true"
                    className="size-4 shrink-0 text-[var(--tm-danger)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {selectedId && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--tm-border)] pt-5">
            <div className="min-w-0 flex-1 text-sm">
              <p
                className={`mb-1 text-xs font-bold uppercase tracking-wide ${
                  selectedOption?.isCorrect
                    ? "text-[var(--tm-success)]"
                    : "text-[var(--tm-danger)]"
                }`}
              >
                {selectedOption?.isCorrect ? "Correct answer" : "Incorrect"}
              </p>
              {currentQuestion.card.exampleEn && (
                <p className="font-medium text-[var(--tm-ink)]">
                  Example: {currentQuestion.card.exampleEn}
                </p>
              )}
              {currentQuestion.card.exampleVi && (
                <p className="mt-0.5 text-[var(--tm-ink-muted)]" lang="vi">
                  {currentQuestion.card.exampleVi}
                </p>
              )}
            </div>
            <button
              className={primaryAction}
              onClick={handleNext}
              type="button"
            >
              {index + 1 >= questions.length
                ? "View results"
                : "Next question →"}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          className={`${secondaryAction} min-h-9 px-3.5 text-xs`}
          onClick={handleRestart}
          type="button"
        >
          <RotateCcw aria-hidden="true" className="size-3.5" />
          Shuffle questions
        </button>
      </div>
    </div>
  );
}
