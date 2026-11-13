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
  answered: "border-[#10b981] bg-[#ecfdf5] text-[#047857] font-medium",
  current: "border-[#ea580c] bg-[#fff7ed] text-[#ea580c] font-semibold",
  unanswered: "border-[#e2e8f0] bg-white text-[#67748b]",
  flagged: "border-[#d97106] bg-[#fffaf4] text-[#d97106] font-semibold",
} as const;

const readingSlotClass = {
  answered: "border-[#d9d2ce] bg-[#10b981] text-white",
  current:
    "border-[#ff5a1f] bg-[#fff7ed] text-[#ff5a1f] ring-2 ring-[#ff5a1f]/30",
  unanswered: "border-[#d9d2ce] bg-[#eee9e6] text-[#77716e]",
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
  const label = `Câu ${number}${flagged ? ", đã gắn cờ" : ""}${state === "answered" ? ", đã trả lời" : ""}`;

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
              ? "absolute top-px left-6 h-1.5 w-1 rounded-[1px] bg-[#eab308]"
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
      aria-label="Ma trận câu hỏi"
      className="flex w-full flex-col gap-2 overflow-y-auto border border-[#e2e8f0] bg-white px-3 pt-3.5 pb-4 lg:w-[380px] lg:shrink-0"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[12.5px] font-semibold text-[#0f172a]">
          Ma trận {LR_TOTAL_QUESTIONS} câu hỏi
        </h2>
        <p className="text-[11.5px] text-[#10b981]">
          {summary.answered} / {LR_TOTAL_QUESTIONS} (
          {percent(summary.answered, LR_TOTAL_QUESTIONS)}%)
        </p>
      </div>
      <ul className="flex flex-wrap gap-2 text-[9.5px]">
        <li className="font-medium text-[#10b981]">
          ■ Đã làm ({summary.answered})
        </li>
        <li className="font-semibold text-[#ea580c]">
          ■ Đang làm ({currentNumbers.length})
        </li>
        <li className="font-semibold text-[#d97106]">⚑ Gắn cờ ({flagCount})</li>
        <li className="text-[#94a3b8]">□ Chưa làm</li>
      </ul>
      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] font-semibold text-[#1d4ed8]">
          Listening (Câu 1–{LISTENING_LAST}): {summary.listeningAnswered}/
          {LISTENING_LAST} đã làm
        </p>
        {partsInSection("listening").map((part) => (
          <div className="flex flex-col gap-1" key={part.id}>
            <p
              className={`text-[9.5px] ${part.first <= (currentNumbers[0] ?? 0) && (currentNumbers[0] ?? 0) <= part.last ? "font-semibold text-[#ea580c]" : "font-medium text-[#67748b]"}`}
            >
              Part {part.id}: {part.title} ({part.first}–{part.last})
              {part.id === 2 ? " [A–C]" : ""}
            </p>
            <SlotGrid {...common} numbers={range(part.first, part.last)} />
          </div>
        ))}
      </div>
      <hr className="border-[#e2e8f0]" />
      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] font-semibold text-[#047857]">
          Reading (Câu 101–200): Bắt đầu sau Listening
        </p>
        <p className="text-[9.5px] font-medium text-[#67748b]">
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
      <p className="rounded bg-[#f8fafc] px-2.5 py-1.5 text-[9.5px] text-[#67748b]">
        Listening tự chạy · Reading tự do điều hướng.
      </p>
    </aside>
  );
}

type PaletteTab = "all" | "listening" | "reading";

function ReadingPalette(props: QuestionPaletteProps) {
  const { answers, flags, currentNumbers, isSelectable, onSelect } = props;
  const [tab, setTab] = useState<PaletteTab>("all");
  const tabs: { id: PaletteTab; label: string }[] = [
    { id: "all", label: "Tất cả" },
    { id: "listening", label: "Listening" },
    { id: "reading", label: "Reading" },
  ];
  const first = tab === "reading" ? LISTENING_LAST + 1 : 1;
  const last = tab === "listening" ? LISTENING_LAST : LR_TOTAL_QUESTIONS;

  return (
    <aside
      aria-label="Ma trận câu hỏi"
      className="flex w-full flex-col gap-3 rounded-2xl border border-[#eee9e6] bg-white p-3 lg:w-[380px] lg:shrink-0"
    >
      <h2 className="text-[15px] font-semibold">
        Ma trận {LR_TOTAL_QUESTIONS} câu
      </h2>
      <p className="text-[11px] text-[#77716e]">
        🔒 Listening 1–{LISTENING_LAST} đã khóa
      </p>
      <div className="flex gap-2" role="tablist" aria-label="Nhóm câu hỏi">
        {tabs.map((item) => (
          <button
            aria-selected={tab === item.id}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${tab === item.id ? "bg-[#fff7ed] text-[#ff5a1f]" : "bg-[#faf7f5] text-[#77716e]"} ${focusRing}`}
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
      <p className="text-[11px] text-[#77716e]">
        {LR_PARTS.filter((part) => part.section === "reading")
          .map((part) => `Part ${part.id}`)
          .join(" · ")}
      </p>
    </aside>
  );
}
