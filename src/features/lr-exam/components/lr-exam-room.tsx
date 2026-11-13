"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatClock } from "@/shared/ui/format-time";
import { sectionForQuestion } from "../parts";
import { findGroup, formatCountdown, summarizeSubmission } from "../session";
import type {
  LrAnswers,
  LrChoiceKey,
  LrExamSummary,
  LrFlags,
  LrQuestion,
  LrQuestionGroup,
} from "../types";
import {
  ExamBrand,
  ExamIcon,
  PassageCard,
  Pill,
  focusRing,
  primaryButton,
  secondaryButton,
} from "./exam-ui";
import { QuestionPalette } from "./question-palette";
import { SubmitConfirmDialog } from "./submit-confirm-dialog";

export interface LrExamRoomProps {
  exam: LrExamSummary;
  groups: LrQuestionGroup[];
  initialNumber: number;
  initialAnswers: LrAnswers;
  initialFlags: LrFlags;
  initialRemainingSeconds: number;
  resultHref: string;
}

function useCountdown(initialSeconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0) onExpire();
  }, [remaining, onExpire]);

  return remaining;
}

export function LrExamRoom({
  exam,
  groups,
  initialNumber,
  initialAnswers,
  initialFlags,
  initialRemainingSeconds,
  resultHref,
}: LrExamRoomProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(initialNumber);
  const [answers, setAnswers] = useState<LrAnswers>(initialAnswers);
  const [flags, setFlags] = useState<LrFlags>(initialFlags);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(() => {
    setSubmitting(true);
    router.push(resultHref);
  }, [router, resultHref]);

  const remaining = useCountdown(initialRemainingSeconds, submit);

  const section = sectionForQuestion(current);
  const group = findGroup(groups, current);
  const sectionGroups = useMemo(
    () => groups.filter((item) => sectionForQuestion(item.first) === section),
    [groups, section],
  );
  const selectable = useMemo(
    () =>
      new Set(
        sectionGroups.flatMap((item) =>
          item.questions.map((question) => question.number),
        ),
      ),
    [sectionGroups],
  );
  const orderedNumbers = useMemo(
    () => [...selectable].sort((a, b) => a - b),
    [selectable],
  );
  const groupIndex = group ? sectionGroups.indexOf(group) : -1;
  const nextGroup = groupIndex >= 0 ? sectionGroups[groupIndex + 1] : undefined;
  const currentNumbers = useMemo(
    () =>
      group
        ? Array.from(
            { length: group.last - group.first + 1 },
            (_, index) => group.first + index,
          )
        : [current],
    [group, current],
  );

  const choose = (number: number, key: LrChoiceKey) =>
    setAnswers((value) => ({ ...value, [number]: key }));

  const toggleFlags = (numbers: readonly number[]) =>
    setFlags((value) => {
      const next = { ...value };
      const allFlagged = numbers.every((number) => value[number]);
      for (const number of numbers) {
        if (allFlagged) delete next[number];
        else next[number] = true;
      }
      return next;
    });

  const neighbor = (direction: -1 | 1) => {
    const index = orderedNumbers.indexOf(current);
    return orderedNumbers[index + direction];
  };

  const palette = (
    <QuestionPalette
      answers={answers}
      currentNumbers={currentNumbers}
      flags={flags}
      isSelectable={(number) => selectable.has(number)}
      onSelect={setCurrent}
      section={section}
    />
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f5] text-[#4c4542]">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[#eee9e6] bg-white px-4 py-2 sm:px-8">
        <ExamBrand />
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold">{exam.identity}</p>
          <p className="text-[11px] text-[#77716e]">
            Phòng thi chuẩn ETS · Kết nối ổn định
          </p>
        </div>
        {section === "listening" ? (
          <span className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-bold text-[#1d4ed8]">
            SECTION 1 · LISTENING
          </span>
        ) : null}
        <div className="flex items-center gap-4">
          <div
            aria-label="Thời gian còn lại"
            className="flex items-center gap-3 rounded-xl bg-[#fff7ed] px-5 py-2.5"
            role="timer"
          >
            <ExamIcon name="timer" />
            <span
              className={`font-mono text-xl font-bold ${section === "listening" ? "text-[#b45309]" : "text-[#302c2a]"}`}
            >
              {formatCountdown(remaining)}
            </span>
          </div>
          <button
            className={
              section === "listening"
                ? `inline-flex h-11 items-center rounded-xl bg-[#ea580c] px-5 text-[13px] font-semibold text-white hover:bg-[#c2410c] ${focusRing}`
                : primaryButton
            }
            onClick={() => setConfirming(true)}
            type="button"
          >
            {section === "listening" ? "Nộp bài thi" : "Nộp bài"}
          </button>
        </div>
      </header>

      {section === "listening" ? (
        <div className="flex flex-1 flex-col bg-[#f8fafc] lg:flex-row">
          <main className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-9">
            {group ? (
              <ListeningGroup
                answers={answers}
                flags={flags}
                group={group}
                nextGroup={nextGroup}
                onChoose={choose}
                onNextGroup={() => nextGroup && setCurrent(nextGroup.first)}
                onToggleFlag={() => toggleFlags(currentNumbers)}
              />
            ) : (
              <EmptyQuestion number={current} />
            )}
          </main>
          {palette}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 xl:flex-row">
          <main className="flex w-full flex-col gap-5 xl:w-[948px] xl:shrink-0">
            {group ? (
              <ReadingContext group={group} />
            ) : (
              <EmptyQuestion number={current} />
            )}
          </main>
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            {group?.questions.some((item) => item.number === current) ? (
              <ReadingQuestion
                flagged={Boolean(flags[current])}
                next={neighbor(1)}
                onChoose={(key) => choose(current, key)}
                onNavigate={setCurrent}
                onToggleFlag={() => toggleFlags([current])}
                previous={neighbor(-1)}
                question={
                  group.questions.find(
                    (item) => item.number === current,
                  ) as LrQuestion
                }
                selected={answers[current]}
              />
            ) : null}
            {palette}
          </div>
        </div>
      )}

      {confirming ? (
        <SubmitConfirmDialog
          onCancel={() => setConfirming(false)}
          onConfirm={submit}
          pending={submitting}
          remainingSeconds={remaining}
          summary={summarizeSubmission(answers, exam.totalQuestions)}
        />
      ) : null}
    </div>
  );
}

function EmptyQuestion({ number }: { number: number }) {
  return (
    <output className="rounded-xl border border-dashed border-[#d9d2ce] bg-white p-6 text-[13px] text-[#77716e] block">
      Chưa có nội dung cho câu {number}.
    </output>
  );
}

function Choice({
  name,
  choice,
  selected,
  onChoose,
  tone,
}: {
  name: string;
  choice: { key: LrChoiceKey; text: string };
  selected: boolean;
  onChoose: () => void;
  tone: "compact" | "roomy";
}) {
  const compact = tone === "compact";
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 border transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#ea580c] ${
        compact
          ? `rounded-md px-3 py-2 text-[12.5px] ${selected ? "border-[#ea580c] bg-[#fff7ed] font-semibold" : "border-[#e6e9ee] bg-white hover:bg-[#f8fafc]"}`
          : `gap-3 rounded-[10px] p-3 text-[13px] ${selected ? "border-2 border-[#ff5a1f] bg-[#fff7ed]" : "border-[#d9d2ce] bg-white hover:bg-[#faf7f5]"}`
      }`}
    >
      <input
        checked={selected}
        className="sr-only"
        name={name}
        onChange={onChoose}
        type="radio"
        value={choice.key}
      />
      <span
        aria-hidden="true"
        className={
          compact
            ? `text-xs ${selected ? "font-bold text-[#ea580c]" : "text-[#94a3b8]"}`
            : `font-semibold whitespace-nowrap ${selected ? "text-[#ff5a1f]" : "text-[#77716e]"}`
        }
      >
        {compact
          ? selected
            ? "●"
            : "○"
          : `${selected ? "●" : "○"} ${choice.key}.`}
      </span>
      <span>
        {compact ? `${choice.key}. ` : ""}
        {choice.text}
      </span>
    </label>
  );
}

function ListeningGroup({
  group,
  answers,
  flags,
  nextGroup,
  onChoose,
  onNextGroup,
  onToggleFlag,
}: {
  group: LrQuestionGroup;
  answers: LrAnswers;
  flags: LrFlags;
  nextGroup?: LrQuestionGroup;
  onChoose: (number: number, key: LrChoiceKey) => void;
  onNextGroup: () => void;
  onToggleFlag: () => void;
}) {
  const flagged = group.questions.every((item) => flags[item.number]);
  const audio = group.audio;
  const progress = audio
    ? Math.round((audio.currentSeconds / audio.totalSeconds) * 100)
    : 0;

  return (
    <>
      {audio ? (
        <section
          aria-label="Trình phát âm thanh"
          className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white px-5 py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-[#1d4ed8]">
              ĐANG PHÁT AUDIO:
            </p>
            <span className="rounded bg-[#fef3c7] px-2 py-[3px] text-[10.5px] font-medium text-[#b45309]">
              Âm thanh tự động chuyển bài · Khóa tua ngược
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="rounded-2xl bg-[#1d4ed8] px-2 py-1 text-[10px] font-bold text-white"
            >
              ▶
            </span>
            <progress
              aria-label="Tiến độ âm thanh"
              className="h-2 flex-1 accent-[#1d4ed8]"
              max={100}
              value={progress}
            />
            <span className="text-xs font-semibold text-[#475569]">
              {formatClock(audio.currentSeconds)} /{" "}
              {formatClock(audio.totalSeconds)}
            </span>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-sm font-bold text-[#0f172a]">{group.heading}</h1>
        {group.description ? (
          <p className="text-xs text-[#67748b]">{group.description}</p>
        ) : null}
      </div>

      {group.questions.map((question) => (
        <fieldset
          className="flex flex-col gap-2.5 rounded-[10px] border border-[#e2e8f0] bg-white px-5 py-4"
          key={question.number}
        >
          <legend className="float-left mb-2.5 flex w-full gap-2 text-[13px]">
            <span className="font-bold text-[#ea580c]">
              CÂU {question.number}:
            </span>
            <span className="font-semibold text-[#0f172a]">
              {question.prompt}
            </span>
          </legend>
          {question.choices.map((choice) => (
            <Choice
              choice={choice}
              key={choice.key}
              name={`question-${question.number}`}
              onChoose={() => onChoose(question.number, choice.key)}
              selected={answers[question.number] === choice.key}
              tone="compact"
            />
          ))}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          aria-pressed={flagged}
          className={`rounded-md border border-[#d97106] px-3.5 py-2 text-[11.5px] font-medium text-[#d97106] ${flagged ? "bg-[#fef3c7]" : "bg-[#fffaf4]"} ${focusRing}`}
          onClick={onToggleFlag}
          type="button"
        >
          Đánh dấu xem lại (Cụm {group.first}–{group.last})
        </button>
        {/* TODO: wire real autosave once the attempt API contract exists. */}
        <output className="text-[11px] text-[#10b981] block">
          ● Đã tự động lưu đáp án trên đám mây
        </output>
        {nextGroup ? (
          <button
            className={`rounded-md bg-[#ea580c] px-4 py-2 text-[11.5px] font-semibold text-white hover:bg-[#c2410c] ${focusRing}`}
            onClick={onNextGroup}
            type="button"
          >
            Cụm tiếp theo ({nextGroup.first}–{nextGroup.last}) →
          </button>
        ) : null}
      </div>
    </>
  );
}

function ReadingContext({ group }: { group: LrQuestionGroup }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Pill>READING · PART {group.part}</Pill>
        <p className="text-[13px] text-[#77716e]">
          Câu {group.first}–{group.last}
          {group.description ? ` · ${group.description}` : ""}
        </p>
      </div>
      <section className="flex flex-col gap-3 rounded-2xl border border-[#eee9e6] bg-[#faf8f7] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill>🔒 Master Audio · Đã hoàn tất</Pill>
          <p className="text-[11px] text-[#77716e]">
            Không tua • Không tạm dừng
          </p>
        </div>
        <p className="text-[13px]">🔒 Listening đã khóa</p>
      </section>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-[#77716e]">
          Chọn nội dung để đánh dấu dẫn chứng.
        </p>
        <Pill>▧ Bôi vàng &nbsp; ⤢ Phóng to</Pill>
      </div>
      {group.passage ? <PassageCard passage={group.passage} /> : null}
      <p className="text-[11px] text-[#77716e]">
        🔒 Phần Listening đã kết thúc. Không thể quay lại chỉnh sửa câu 1–100.
      </p>
    </>
  );
}

function ReadingQuestion({
  question,
  selected,
  flagged,
  previous,
  next,
  onChoose,
  onToggleFlag,
  onNavigate,
}: {
  question: LrQuestion;
  selected?: LrChoiceKey;
  flagged: boolean;
  previous?: number;
  next?: number;
  onChoose: (key: LrChoiceKey) => void;
  onToggleFlag: () => void;
  onNavigate: (number: number) => void;
}) {
  return (
    <section
      aria-label={`Câu hỏi ${question.number}`}
      className="flex flex-1 flex-col gap-4 rounded-2xl bg-white p-4"
    >
      <Pill>QUESTION {question.number}</Pill>
      <h2 className="text-lg font-semibold">{question.prompt}</h2>
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Đáp án cho câu {question.number}</legend>
        {question.choices.map((choice) => (
          <Choice
            choice={choice}
            key={choice.key}
            name={`question-${question.number}`}
            onChoose={() => onChoose(choice.key)}
            selected={selected === choice.key}
            tone="roomy"
          />
        ))}
      </fieldset>
      <button
        aria-pressed={flagged}
        className={`w-fit rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#d97706] ${flagged ? "bg-[#fde68a]" : "bg-[#fef3c7]"} ${focusRing}`}
        onClick={onToggleFlag}
        type="button"
      >
        ⚑ Gắn cờ xem lại
      </button>
      <div className="flex items-center justify-between gap-3">
        <button
          className={secondaryButton}
          disabled={previous === undefined}
          onClick={() => previous !== undefined && onNavigate(previous)}
          type="button"
        >
          ← Câu trước
        </button>
        <button
          className={primaryButton}
          disabled={next === undefined}
          onClick={() => next !== undefined && onNavigate(next)}
          type="button"
        >
          Câu tiếp →
        </button>
      </div>
      <output className="text-[11px] text-[#77716e] block">
        ✓ Đáp án đã được lưu
        <br />
        Kết nối máy chủ ổn định
      </output>
    </section>
  );
}
