"use client";

import { X } from "lucide-react";
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
import type { CreateFlashcardCardPayload } from "../api";
import type { CefrLevel } from "../types";

export function CardAddDialog({
  deckTitle,
  open,
  onOpenChange,
  onAddCard,
}: {
  deckTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (payload: CreateFlashcardCardPayload) => Promise<void> | void;
}) {
  const [term, setTerm] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("noun");
  const [level, setLevel] = useState<CefrLevel>("B2");
  const [exampleEn, setExampleEn] = useState("");
  const [exampleVi, setExampleVi] = useState("");
  const [collocationsText, setCollocationsText] = useState("");
  const [termError, setTermError] = useState<string | null>(null);
  const [meaningError, setMeaningError] = useState<string | null>(null);
  const [collocationsError, setCollocationsError] = useState<string | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTerm("");
    setMeaningVi("");
    setPhonetic("");
    setPartOfSpeech("noun");
    setLevel("B2");
    setExampleEn("");
    setExampleVi("");
    setCollocationsText("");
    setTermError(null);
    setMeaningError(null);
    setCollocationsError(null);
    setSubmitError(null);
    setSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (submitting) return;
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanTerm = term.trim();
    const cleanMeaning = meaningVi.trim();
    const collocations = collocationsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    let hasError = false;
    if (!cleanTerm) {
      setTermError("Please enter an English term.");
      hasError = true;
    } else {
      setTermError(null);
    }

    if (!cleanMeaning) {
      setMeaningError("Please enter the meaning.");
      hasError = true;
    } else {
      setMeaningError(null);
    }

    if (collocations.length > 10) {
      setCollocationsError("You can add at most 10 collocations.");
      hasError = true;
    } else if (collocations.some((item) => item.length > 80)) {
      setCollocationsError("Each collocation must be 80 characters or fewer.");
      hasError = true;
    } else {
      setCollocationsError(null);
    }

    if (hasError) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onAddCard({
        term: cleanTerm,
        meaningVi: cleanMeaning,
        phonetic: phonetic.trim() || undefined,
        partOfSpeech: partOfSpeech.trim() || "noun",
        level,
        exampleEn: exampleEn.trim() || undefined,
        exampleVi: exampleVi.trim() || undefined,
        collocations,
        toeicPart: "Personal Vocab",
      });
      reset();
      onOpenChange(false);
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? cause.message
          : "Could not add word to the deck. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="add-card-description"
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] shadow-[0_24px_64px_-12px_rgb(0_0_0/0.25)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--tm-border)] px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-bold text-[var(--tm-ink)]">
                Add Word to Deck
              </Dialog.Title>
              <Dialog.Description
                className="mt-1 text-sm text-[var(--tm-ink-muted)]"
                id="add-card-description"
              >
                Deck:{" "}
                <span className="font-semibold text-[var(--tm-ink)]">
                  {deckTitle}
                </span>
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
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField error={termError} label="English term" required>
                  <FormInput
                    className="min-h-10"
                    maxLength={120}
                    onChange={(e) => {
                      setTerm(e.target.value);
                      if (termError) setTermError(null);
                      if (submitError) setSubmitError(null);
                    }}
                    placeholder="e.g. invoice"
                    type="text"
                    value={term}
                  />
                </FormField>

                <FormField error={meaningError} label="Meaning" required>
                  <FormInput
                    className="min-h-10"
                    maxLength={300}
                    onChange={(e) => {
                      setMeaningVi(e.target.value);
                      if (meaningError) setMeaningError(null);
                      if (submitError) setSubmitError(null);
                    }}
                    placeholder="e.g. payment bill or statement"
                    type="text"
                    value={meaningVi}
                  />
                </FormField>

                <FormField label="IPA pronunciation">
                  <FormInput
                    className="min-h-10"
                    maxLength={120}
                    onChange={(e) => setPhonetic(e.target.value)}
                    placeholder="e.g. /ˈɪn.vɔɪs/"
                    type="text"
                    value={phonetic}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Part of speech">
                    <FormSelect
                      className="min-h-10"
                      onChange={(e) => setPartOfSpeech(e.target.value)}
                      value={partOfSpeech}
                    >
                      <option value="noun">noun</option>
                      <option value="verb">verb</option>
                      <option value="adjective">adjective</option>
                      <option value="adverb">adverb</option>
                      <option value="phrasal verb">phrasal verb</option>
                    </FormSelect>
                  </FormField>

                  <FormField label="Level">
                    <FormSelect
                      className="min-h-10"
                      onChange={(e) => setLevel(e.target.value as CefrLevel)}
                      value={level}
                    >
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                    </FormSelect>
                  </FormField>
                </div>

                <FormField className="sm:col-span-2" label="Example sentence">
                  <FormInput
                    className="min-h-10"
                    maxLength={400}
                    onChange={(e) => setExampleEn(e.target.value)}
                    placeholder="Please check the invoice before Friday."
                    type="text"
                    value={exampleEn}
                  />
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  label="Example explanation"
                >
                  <FormInput
                    className="min-h-10"
                    maxLength={400}
                    onChange={(e) => setExampleVi(e.target.value)}
                    placeholder="Please review the payment bill before Friday."
                    type="text"
                    value={exampleVi}
                  />
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  error={collocationsError}
                  label="Collocations (comma-separated)"
                >
                  <FormInput
                    className="min-h-10"
                    maxLength={500}
                    onChange={(e) => {
                      setCollocationsText(e.target.value);
                      if (collocationsError) setCollocationsError(null);
                    }}
                    placeholder="issue an invoice, overdue invoice"
                    type="text"
                    value={collocationsText}
                  />
                </FormField>
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
                {submitting ? "Saving…" : "Add to Deck"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
