"use client";

import { Plus, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState, type FormEvent } from "react";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import {
  FormField,
  FormInput,
  FormSelect,
} from "@/shared/components/ui/form-field";
import { slugifyDeckTitle } from "../storage";
import type { FlashcardDeck, FlashcardItem } from "../types";

interface DraftCard {
  key: string;
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
}

function createEmptyDraft(index: number): DraftCard {
  return {
    key: `draft-${Date.now()}-${index}`,
    term: "",
    phonetic: "",
    partOfSpeech: "noun",
    meaningVi: "",
    exampleEn: "",
    exampleVi: "",
  };
}

export function DeckCreateDialog({
  open,
  onOpenChange,
  onCreateDeck,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDeck: (deck: FlashcardDeck) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [draftCards, setDraftCards] = useState<DraftCard[]>([
    createEmptyDraft(1),
    createEmptyDraft(2),
  ]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDraftCards([createEmptyDraft(1), createEmptyDraft(2)]);
    setTitleError(null);
    setCardsError(null);
    setSubmitError(null);
    setSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (submitting) return;
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const updateCard = (
    key: string,
    field: keyof Omit<DraftCard, "key">,
    value: string,
  ) => {
    setDraftCards((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addCardRow = () => {
    setDraftCards((prev) => [...prev, createEmptyDraft(prev.length + 1)]);
  };

  const removeCardRow = (key: string) => {
    setDraftCards((prev) =>
      prev.length > 1 ? prev.filter((item) => item.key !== key) : prev,
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const validCards: FlashcardItem[] = draftCards
      .filter((item) => item.term.trim() && item.meaningVi.trim())
      .map((item, idx) => ({
        id: `custom-${Date.now()}-${idx}`,
        term: item.term.trim(),
        phonetic: item.phonetic.trim(),
        partOfSpeech: item.partOfSpeech.trim() || "noun",
        meaningVi: item.meaningVi.trim(),
        exampleEn: item.exampleEn.trim(),
        exampleVi: item.exampleVi.trim(),
        collocations: [],
        toeicPart: "Personal Vocab",
        level: "B2",
      }));

    let hasValidationError = false;
    if (!cleanTitle) {
      setTitleError("Please enter a deck title.");
      hasValidationError = true;
    } else {
      setTitleError(null);
    }

    if (validCards.length === 0) {
      setCardsError(
        "At least 1 card with both an English term and a meaning is required.",
      );
      hasValidationError = true;
    } else {
      setCardsError(null);
    }

    if (hasValidationError) return;

    const deckId = `custom-deck-${Date.now()}`;
    const newDeck: FlashcardDeck = {
      id: deckId,
      slug: `${slugifyDeckTitle(cleanTitle)}-${Date.now().toString(36).slice(-4)}`,
      title: cleanTitle,
      description: description.trim() || "Your custom TOEIC vocabulary deck.",
      category: "custom",
      targetScore: "Custom",
      estimatedMinutes: Math.max(2, Math.ceil(validCards.length * 0.8)),
      isCustom: true,
      cards: validCards,
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onCreateDeck(newDeck);
      resetForm();
      onOpenChange(false);
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? cause.message
          : "Could not save the deck. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="create-deck-description"
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] shadow-[0_24px_64px_-12px_rgb(0_0_0/0.25)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--tm-border)] px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-bold text-[var(--tm-ink)]">
                Create New Flashcard Deck
              </Dialog.Title>
              <Dialog.Description
                className="mt-1 text-sm text-[var(--tm-ink-muted)]"
                id="create-deck-description"
              >
                Save your personal vocabulary deck to study alongside standard
                TOEIC decks.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-[var(--tm-ink-muted)] transition hover:bg-[var(--tm-surface-muted)] hover:text-[var(--tm-ink)] ${focusRing}`}
                disabled={submitting}
                type="button"
              >
                <X aria-hidden="true" className="size-4" strokeWidth={2} />
              </button>
            </Dialog.Close>
          </div>

          <form
            className="flex min-h-0 flex-1 flex-col"
            noValidate
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  className="sm:col-span-2"
                  error={titleError}
                  label="Deck title"
                  required
                >
                  <FormInput
                    maxLength={80}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (titleError) setTitleError(null);
                      if (submitError) setSubmitError(null);
                    }}
                    placeholder="e.g. Tricky Part 7 vocabulary this week"
                    type="text"
                    value={title}
                  />
                </FormField>

                <FormField className="sm:col-span-2" label="Short description">
                  <FormInput
                    maxLength={160}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Topic notes or study goal"
                    type="text"
                    value={description}
                  />
                </FormField>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--tm-ink)]">
                    Cards ({draftCards.length})
                  </span>
                  <button
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--tm-brand)] transition hover:bg-[var(--tm-brand-soft)] ${focusRing}`}
                    onClick={addCardRow}
                    type="button"
                  >
                    <Plus aria-hidden="true" className="size-3.5" />
                    Add card
                  </button>
                </div>

                <div className="space-y-3">
                  {draftCards.map((card, index) => {
                    const showFirstCardError = Boolean(
                      cardsError && index === 0,
                    );
                    return (
                      <div
                        className="rounded-xl border border-[var(--tm-border)] bg-[var(--tm-page)] p-4"
                        key={card.key}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="sp-mono text-xs font-semibold text-[var(--tm-ink-muted)]">
                            Card #{index + 1}
                          </span>
                          {draftCards.length > 1 && (
                            <button
                              aria-label={`Remove card ${index + 1}`}
                              className={`inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-[var(--tm-ink-muted)] transition hover:bg-[var(--tm-danger-soft)] hover:text-[var(--tm-danger)] ${focusRing}`}
                              onClick={() => removeCardRow(card.key)}
                              type="button"
                            >
                              <Trash2 aria-hidden="true" className="size-3.5" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <FormInput
                            aria-describedby={
                              showFirstCardError
                                ? "create-deck-cards-error"
                                : undefined
                            }
                            aria-invalid={
                              showFirstCardError && !card.term.trim()
                                ? true
                                : undefined
                            }
                            aria-label={`Card ${index + 1} term`}
                            className="min-h-10"
                            onChange={(e) => {
                              updateCard(card.key, "term", e.target.value);
                              if (cardsError) setCardsError(null);
                              if (submitError) setSubmitError(null);
                            }}
                            placeholder="English term (e.g. reimburse) *"
                            type="text"
                            value={card.term}
                          />
                          <FormInput
                            aria-describedby={
                              showFirstCardError
                                ? "create-deck-cards-error"
                                : undefined
                            }
                            aria-invalid={
                              showFirstCardError && !card.meaningVi.trim()
                                ? true
                                : undefined
                            }
                            aria-label={`Card ${index + 1} meaning`}
                            className="min-h-10"
                            onChange={(e) => {
                              updateCard(card.key, "meaningVi", e.target.value);
                              if (cardsError) setCardsError(null);
                              if (submitError) setSubmitError(null);
                            }}
                            placeholder="Meaning *"
                            type="text"
                            value={card.meaningVi}
                          />
                          <FormInput
                            aria-label={`Card ${index + 1} pronunciation`}
                            className="min-h-10"
                            onChange={(e) =>
                              updateCard(card.key, "phonetic", e.target.value)
                            }
                            placeholder="IPA pronunciation (optional)"
                            type="text"
                            value={card.phonetic}
                          />
                          <FormSelect
                            aria-label={`Card ${index + 1} part of speech`}
                            className="min-h-10"
                            onChange={(e) =>
                              updateCard(
                                card.key,
                                "partOfSpeech",
                                e.target.value,
                              )
                            }
                            value={card.partOfSpeech}
                          >
                            <option value="noun">noun</option>
                            <option value="verb">verb</option>
                            <option value="adjective">adjective</option>
                            <option value="adverb">adverb</option>
                            <option value="phrasal verb">phrasal verb</option>
                          </FormSelect>
                          <FormInput
                            aria-label={`Card ${index + 1} example sentence`}
                            className="min-h-10 sm:col-span-2"
                            onChange={(e) =>
                              updateCard(card.key, "exampleEn", e.target.value)
                            }
                            placeholder="Example sentence (optional)"
                            type="text"
                            value={card.exampleEn}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {cardsError && (
                  <p
                    className="rounded-lg border border-[var(--tm-danger)]/35 bg-[var(--tm-danger-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--tm-danger)]"
                    id="create-deck-cards-error"
                    role="alert"
                  >
                    {cardsError}
                  </p>
                )}
              </div>

              {submitError && (
                <p
                  className="rounded-lg border border-[var(--tm-danger)]/35 bg-[var(--tm-danger-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--tm-danger)]"
                  role="alert"
                >
                  {submitError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--tm-border)] px-6 py-4">
              <Dialog.Close asChild>
                <button
                  className={secondaryAction}
                  disabled={submitting}
                  type="button"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                className={primaryAction}
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Saving…" : "Save deck"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
