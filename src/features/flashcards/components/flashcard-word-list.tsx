"use client";

import { Star, Volume2 } from "lucide-react";
import { useWordSpeech } from "@/features/pronunciation/hooks/use-word-speech";
import { focusRing } from "@/shared/components/practice/styles";
import { getCardStatus, isCardStarred } from "../storage";
import type { CardMastery, CardProgressRecord, FlashcardItem } from "../types";

export function FlashcardWordList({
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

  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--tm-border)] bg-[var(--tm-surface)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--tm-border)] bg-[var(--tm-page)] text-xs font-semibold text-[var(--tm-ink-muted)]">
              <th className="px-5 py-3.5">Term &amp; Pronunciation</th>
              <th className="px-5 py-3.5">Meaning &amp; Example</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tm-border)]">
            {cards.map((card) => {
              const status = getCardStatus(progress, card.id);
              const starred = isCardStarred(progress, card.id);
              return (
                <tr
                  className="transition hover:bg-[var(--tm-page)]"
                  key={card.id}
                >
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[15px] font-bold text-[var(--tm-ink)]">
                        {card.term}
                      </span>
                      <span className="text-xs italic text-[var(--tm-ink-muted)]">
                        {card.partOfSpeech}
                      </span>
                    </div>
                    {card.phonetic && (
                      <p className="sp-mono mt-0.5 text-xs text-[var(--tm-ink-muted)]">
                        {card.phonetic}
                      </p>
                    )}
                    <span className="mt-1.5 inline-block rounded bg-[var(--tm-brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--tm-brand)]">
                      {card.toeicPart} · {card.level}
                    </span>
                  </td>

                  <td className="max-w-md px-5 py-4 align-top">
                    <p className="font-semibold text-[var(--tm-ink)]" lang="vi">
                      {card.meaningVi}
                    </p>
                    {card.exampleEn && (
                      <p className="mt-1 text-xs leading-relaxed text-[var(--tm-ink-muted)]">
                        {card.exampleEn}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 align-top">
                    <select
                      aria-label={`Mastery status for ${card.term}`}
                      className={`min-h-9 cursor-pointer rounded-lg border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-2.5 text-xs font-semibold text-[var(--tm-ink)] ${focusRing}`}
                      onChange={(e) =>
                        onRateCard(card.id, e.target.value as CardMastery)
                      }
                      value={status}
                    >
                      <option value="new">Not studied</option>
                      <option value="learning">Still learning</option>
                      <option value="review">Needs review</option>
                      <option value="mastered">Mastered</option>
                    </select>
                  </td>

                  <td className="px-4 py-4 align-top text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {speechSupported && (
                        <button
                          aria-label={`Listen to pronunciation of ${card.term}`}
                          className={`grid size-9 cursor-pointer place-items-center rounded-lg border border-[var(--tm-border)] text-[var(--tm-ink-muted)] transition hover:border-[var(--tm-brand)] hover:text-[var(--tm-brand)] ${focusRing}`}
                          onClick={() => speak(card.term)}
                          type="button"
                        >
                          <Volume2 aria-hidden="true" className="size-4" />
                        </button>
                      )}
                      <button
                        aria-label={
                          starred ? `Unstar ${card.term}` : `Star ${card.term}`
                        }
                        aria-pressed={starred}
                        className={`grid size-9 cursor-pointer place-items-center rounded-lg border transition ${focusRing} ${
                          starred
                            ? "border-[var(--tm-warning)]/50 bg-[var(--tm-warning-soft)] text-[var(--tm-warning)]"
                            : "border-[var(--tm-border)] text-[var(--tm-ink-muted)] hover:border-[var(--tm-border-strong)] hover:text-[var(--tm-ink)]"
                        }`}
                        onClick={() => onToggleStar(card.id)}
                        type="button"
                      >
                        <Star
                          aria-hidden="true"
                          className="size-4"
                          fill={starred ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
