"use client";

import { useState } from "react";
import {
  LISTENING_LAST,
  LR_PARTS,
  LR_TOTAL_QUESTIONS,
  partsInSection,
} from "../parts";
import { percent, range, slotState, summarizeSubmission } from "../session";
import type { LrAnswers, LrFlags, LrSection } from "../types";
import { focusRing } from "./exam-ui";

export interface QuestionPaletteProps {
  /** The section the learner is currently sitting in. */
  section: LrSection;
  answers: LrAnswers;
  flags: LrFlags;
  currentNumbers: readonly number[];
  /** Numbers that have content and may be opened. */
  isSelectable: (number: number) => boolean;
  onSelect: (number: number) => void;
}

const listeningSlotClass = {
  answered:
    "border-[var(--tm-success)] bg-[var(--tm-success-soft)] text-[var(--tm-success)] font-medium",
  current:
    "border-[var(--tm-brand)] bg-[var(--tm-brand-soft)] text-[var(--tm-brand)] font-semibold",
  unanswered:
    "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-ink-muted)]",
  flagged:
    "border-[var(--tm-warning)] bg-[var(--tm-warning-soft)] text-[var(--tm-warning)] font-semibold",
} as const;

const readingSlotClass = {
  answered: "border-[var(--tm-success)] bg-[var(--tm-success)] text-white",
  current:
    "border-[var(--tm-brand)] bg-[var(--tm-brand-soft)] text-[var(--tm-brand)] ring-2 ring-[var(--tm-brand)]/30",
  unanswered:
    "border-[var(--tm-border-strong)] bg-[var(--tm-surface-muted)] text-[var(--tm-ink-muted)]",
} as const;

function Slot({
  number,
  section,
  answers,
  flags,
  currentNumbers,
  disabled,
  onSelect,
}: {
  number: number;
  section: LrSection;
  disabled: boolean;
  onSelect: (number: number) => void;
} & Pick<QuestionPaletteProps, "answers" | "flags" | "currentNumbers">) {
  const { state, flagged } = slotState(number, {
    answers,
    flags,
    currentNumbers,
  });
  const readingStyle = section === "reading";
  const tone = readingStyle
    ? readingSlotClass[state]
    : flagged && state !== "current"
      ? listeningSlotClass.flagged
      : listeningSlotClass[state];
  const size = readingStyle
    ? "h-7 rounded-md text-[11px] font-semibold"
    : "h-6 rounded text-[9.5px]";
  const label = `Question ${number}${flagged ? ", flagged" : ""}${state === "answered" ? ", answered" : ""}`;

  return (
    <button
      aria-current={state === "current" ? "true" : undefined}
      aria-label={label}
      className={`relative flex w-8 items-center justify-center border ${size} ${tone} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${focusRing}`}
      disabled={disabled}
      onClick={() => onSelect(number)}
      type="button"
    >
      {number}
      {flagged ? (
        <span
          aria-hidden="true"
          className={
            readingStyle
              ? "absolute top-px left-6 h-1.5 w-1 rounded-[1px] bg-[var(--tm-warning)]"
              : "ml-px text-[8.5px]"
          }
        >
          {readingStyle ? "" : "⚑"}
        </span>
      ) : null}
    </button>
  );
}

function SlotGrid({
  numbers,
  ...slot
}: { numbers: number[] } & Omit<
  Parameters<typeof Slot>[0],
  "number" | "disabled"
> & { isSelectable: (number: number) => boolean }) {
  const { isSelectable, ...rest } = slot;
  return (
    <div className="flex flex-wrap gap-1">
      {numbers.map((number) => (
        <Slot
          {...rest}
          disabled={!isSelectable(number)}
          key={number}
          number={number}
        />
      ))}
    </div>
  );
}

export function QuestionPalette(props: QuestionPaletteProps) {
  return props.section === "listening" ? (
    <ListeningPalette {...props} />
  ) : (
    <ReadingPalette {...props} />
  );
}

function ListeningPalette(props: QuestionPaletteProps) {
  const { answers, flags, currentNumbers, isSelectable, onSelect } = props;
  const summary = summarizeSubmission(answers);
  const flagCount = Object.keys(flags).length;
  const common = {
    section: "listening" as const,
    answers,
    flags,
    currentNumbers,
    isSelectable,
    onSelect,
  };

  return (
    <aside
      aria-label="Question palette"
      className="flex w-full min-w-0 flex-col gap-2 overflow-y-auto border border-[var(--tm-border)] bg-[var(--tm-surface)] px-3 pt-3.5 pb-4 lg:w-[340px] lg:shrink-0 xl:w-[360px]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[12.5px] font-semibold text-[var(--tm-ink)]">
          {LR_TOTAL_QUESTIONS}-Question Palette
        </h2>
        <p className="text-[11.5px] font-semibold text-[var(--tm-success)]">
          {summary.answered} / {LR_TOTAL_QUESTIONS} (
          {percent(summary.answered, LR_TOTAL_QUESTIONS)}%)
        </p>
      </div>
      <ul className="flex flex-wrap gap-2 text-[9.5px]">
        <li className="font-medium text-[var(--tm-success)]">
          ■ Answered ({summary.answered})
        </li>
        <li className="font-semibold text-[var(--tm-brand)]">
          ■ Current ({currentNumbers.length})
        </li>
        <li className="font-semibold text-[var(--tm-warning)]">
          ⚑ Flagged ({flagCount})
        </li>
        <li className="text-[var(--tm-ink-muted)]">□ Unanswered</li>
      </ul>
      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] font-semibold text-[var(--tm-info)]">
          Listening (Q1–{LISTENING_LAST}): {summary.listeningAnswered}/
          {LISTENING_LAST} answered
        </p>
        {partsInSection("listening").map((part) => (
          <div className="flex flex-col gap-1" key={part.id}>
            <p
              className={`text-[9.5px] ${part.first <= (currentNumbers[0] ?? 0) && (currentNumbers[0] ?? 0) <= part.last ? "font-semibold text-[var(--tm-brand)]" : "font-medium text-[var(--tm-ink-muted)]"}`}
            >
              Part {part.id}: {part.title} ({part.first}–{part.last})
              {part.id === 2 ? " [A–C]" : ""}
            </p>
            <SlotGrid {...common} numbers={range(part.first, part.last)} />
          </div>
        ))}
      </div>
      <hr className="border-[var(--tm-border)]" />
      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] font-semibold text-[var(--tm-success)]">
          Reading (Q101–200): Starts after Listening
        </p>
        <p className="text-[9.5px] font-medium text-[var(--tm-ink-muted)]">
          {partsInSection("reading")
            .map((part) => `Part ${part.id} (${part.first}–${part.last})`)
            .join(" · ")}
        </p>
        <SlotGrid
          {...common}
          isSelectable={() => false}
          numbers={range(LISTENING_LAST + 1, LR_TOTAL_QUESTIONS)}
        />
      </div>
      <p className="rounded bg-[var(--tm-page)] px-2.5 py-1.5 text-[9.5px] text-[var(--tm-ink-muted)]">
        Listening plays automatically · Reading allows free navigation.
      </p>
    </aside>
  );
}

type PaletteTab = "all" | "listening" | "reading";

function ReadingPalette(props: QuestionPaletteProps) {
  const { answers, flags, currentNumbers, isSelectable, onSelect } = props;
  const [tab, setTab] = useState<PaletteTab>("all");
  const tabs: { id: PaletteTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "listening", label: "Listening" },
    { id: "reading", label: "Reading" },
  ];
  const first = tab === "reading" ? LISTENING_LAST + 1 : 1;
  const last = tab === "listening" ? LISTENING_LAST : LR_TOTAL_QUESTIONS;

  return (
    <aside
      aria-label="Question palette"
      className="flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] p-3"
    >
      <h2 className="text-[15px] font-semibold text-[var(--tm-ink)]">
        {LR_TOTAL_QUESTIONS}-Question Palette
      </h2>
      <p className="text-[11px] text-[var(--tm-ink-muted)]">
        🔒 Listening 1–{LISTENING_LAST} locked
      </p>
      <div className="flex gap-2" role="tablist" aria-label="Question groups">
        {tabs.map((item) => (
          <button
            aria-selected={tab === item.id}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${tab === item.id ? "bg-[var(--tm-brand-soft)] text-[var(--tm-brand)]" : "bg-[var(--tm-page)] text-[var(--tm-ink-muted)]"} ${focusRing}`}
            key={item.id}
            onClick={() => setTab(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <SlotGrid
        answers={answers}
        currentNumbers={currentNumbers}
        flags={flags}
        isSelectable={(number) =>
          number > LISTENING_LAST && isSelectable(number)
        }
        numbers={range(first, last)}
        onSelect={onSelect}
        section="reading"
      />
      <p className="text-[11px] text-[var(--tm-ink-muted)]">
        {LR_PARTS.filter((part) => part.section === "reading")
          .map((part) => `Part ${part.id}`)
          .join(" · ")}
      </p>
    </aside>
  );
}
