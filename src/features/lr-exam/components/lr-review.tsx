"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatClock } from "@/shared/ui/format-time";
import { LISTENING_LAST, LR_TOTAL_QUESTIONS } from "../parts";
import { range } from "../session";
import type { LrReviewGroup, LrReviewQuestionDetail } from "../types";
import type { LrReviewState } from "../loaders";
import {
  ExamBrand,
  PassageCard,
  Pill,
  focusRing,
  primaryButton,
  secondaryButton,
} from "./exam-ui";

type Filter = "all" | "wrong" | "flagged";

const statusLabel = {
  correct: "Đúng",
  wrong: "Sai",
  skipped: "Bỏ qua",
} as const;

const slotTone = {
  correct: "border-[#10b981] bg-[#ecfdf5] text-[#047857]",
  wrong: "border-[#dc2626] bg-[#fee2e2] text-[#dc2626]",
  skipped: "border-[#d97706] bg-[#fef3c7] text-[#d97706]",
} as const;

export function LrReview({
  state,
  resultHref,
}: {
  state: LrReviewState;
  resultHref: string;
}) {
  const { groups, statuses, counts, flags, exam } = state;
  const detailed = useMemo(
    () =>
      new Map<
        number,
        { group: LrReviewGroup; question: LrReviewQuestionDetail }
      >(
        groups.flatMap((group) =>
          group.questions.map(
            (question) => [question.number, { group, question }] as const,
          ),
        ),
      ),
    [groups],
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [current, setCurrent] = useState(groups[0]?.questions[0]?.number ?? 1);

  const visible = useMemo(
    () =>
      range(1, LR_TOTAL_QUESTIONS).filter((number) =>
        filter === "wrong"
          ? statuses[number] !== "correct"
          : filter === "flagged"
            ? flags[number]
            : true,
      ),
    [filter, statuses, flags],
  );
  const reviewable = visible.filter((number) => detailed.has(number));
  const index = reviewable.indexOf(current);
  const entry = detailed.get(current);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: `Tất cả (${LR_TOTAL_QUESTIONS})` },
    { id: "wrong", label: `Sai / Bỏ qua (${counts.wrong + counts.skipped})` },
    { id: "flagged", label: `Gắn cờ (${Object.keys(flags).length})` },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f5] text-[#4c4542]">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[#eee9e6] bg-white px-4 py-2 sm:px-8">
        <ExamBrand />
        <p className="text-[15px] font-semibold">
          Xem lại bài làm · {exam.identity}
        </p>
        <Link className={secondaryButton} href={resultHref}>
          ← Về báo cáo kết quả
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 xl:flex-row">
        <main className="flex min-w-0 flex-1 flex-col gap-5">
          <div
            className="flex flex-wrap items-center gap-3"
            role="tablist"
            aria-label="Bộ lọc câu hỏi"
          >
            {tabs.map((tab) => (
              <button
                aria-selected={filter === tab.id}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === tab.id ? "bg-[#fff7ed] text-[#ff5a1f]" : "bg-white text-[#77716e]"} ${focusRing}`}
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {entry ? (
            <ReviewDetail
              entry={entry}
              flagged={Boolean(flags[current])}
              status={statuses[current] ?? "skipped"}
            />
          ) : (
            <output className="rounded-xl border border-dashed border-[#d9d2ce] bg-white p-6 text-[13px] text-[#77716e] block">
              Chưa có giải thích chi tiết cho câu {current}.
            </output>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              className={secondaryButton}
              disabled={index <= 0}
              onClick={() => setCurrent(reviewable[index - 1])}
              type="button"
            >
              ← Câu trước
            </button>
            <button
              className={primaryButton}
              disabled={index < 0 || index >= reviewable.length - 1}
              onClick={() => setCurrent(reviewable[index + 1])}
              type="button"
            >
              Câu tiếp →
            </button>
          </div>
        </main>

        <aside
          aria-label="Ma trận kết quả"
          className="flex w-full flex-col gap-3 rounded-2xl border border-[#eee9e6] bg-white p-4 xl:w-[380px] xl:shrink-0"
        >
          <h2 className="text-[15px] font-semibold">
            Ma trận {LR_TOTAL_QUESTIONS} câu
          </h2>
          <ul className="flex flex-wrap gap-3 text-[11px]">
            <li className="text-[#047857]">■ Đúng ({counts.correct})</li>
            <li className="text-[#dc2626]">■ Sai ({counts.wrong})</li>
            <li className="text-[#d97706]">■ Bỏ qua ({counts.skipped})</li>
            <li className="text-[#d97106]">⚑ Gắn cờ</li>
          </ul>
          <div className="flex flex-wrap gap-1">
            {range(1, LR_TOTAL_QUESTIONS).map((number) => {
              const status = statuses[number] ?? "skipped";
              const hidden = !visible.includes(number);
              return (
                <button
                  aria-current={number === current ? "true" : undefined}
                  aria-label={`Câu ${number}, ${statusLabel[status]}${flags[number] ? ", đã gắn cờ" : ""}`}
                  className={`h-7 w-8 rounded-md border text-[11px] font-semibold ${slotTone[status]} ${number === current ? "ring-2 ring-[#ff5a1f]" : ""} ${hidden ? "opacity-30" : ""} ${focusRing}`}
                  key={number}
                  onClick={() => setCurrent(number)}
                  type="button"
                >
                  {number}
                  {flags[number] ? <span aria-hidden="true">⚑</span> : null}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#77716e]">
            Listening 1–{LISTENING_LAST} · Reading {LISTENING_LAST + 1}–
            {LR_TOTAL_QUESTIONS}. Demo chỉ có giải thích cho một số câu.
          </p>
        </aside>
      </div>
    </div>
  );
}

function ReviewDetail({
  entry,
  status,
  flagged,
}: {
  entry: { group: LrReviewGroup; question: LrReviewQuestionDetail };
  status: keyof typeof statusLabel;
  flagged: boolean;
}) {
  const { group, question } = entry;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        {group.audio ? (
          <section
            aria-label="Audio"
            className="flex flex-col gap-2 rounded-xl border border-[#e2e8f0] bg-white p-4"
          >
            <p className="text-[11px] text-[#77716e]">{group.audio.note}</p>
            <p className="text-xs font-semibold text-[#475569]">
              {formatClock(group.audio.currentSeconds)} /{" "}
              {formatClock(group.audio.totalSeconds)}
            </p>
          </section>
        ) : null}
        {group.passage ? <PassageCard passage={group.passage} /> : null}
        {group.translation ? (
          <section className="flex flex-col gap-2 rounded-xl bg-[#eff6ff] p-4 text-[13px]">
            <blockquote className="font-semibold text-[#1d4ed8]">
              {group.translation.quote}
            </blockquote>
            <p>{group.translation.body}</p>
            <p className="text-[11px] text-[#77716e]">
              {group.translation.note}
            </p>
          </section>
        ) : null}
      </div>

      <section
        aria-label={`Giải thích câu ${question.number}`}
        className="flex flex-col gap-4 rounded-2xl border border-[#eee9e6] bg-white p-6"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Pill>CÂU {question.number}</Pill>
          <Pill
            tone={
              status === "correct"
                ? "success"
                : status === "wrong"
                  ? "danger"
                  : "warning"
            }
          >
            {statusLabel[status]}
          </Pill>
          {flagged ? <Pill tone="warning">⚑ Đã gắn cờ</Pill> : null}
        </div>
        <h2 className="text-lg font-semibold">{question.prompt}</h2>
        <ul className="flex flex-col gap-2">
          {question.choices.map((choice) => {
            const isCorrect = choice.key === question.correct;
            const isSelected = choice.key === question.selected;
            return (
              <li
                className={`flex gap-2 rounded-[10px] border p-3 text-[13px] ${isCorrect ? "border-[#10b981] bg-[#ecfdf5]" : isSelected ? "border-[#dc2626] bg-[#fee2e2]" : "border-[#d9d2ce] bg-white"}`}
                key={choice.key}
              >
                <span className="font-semibold">{choice.key}.</span>
                <span>{choice.text}</span>
                {isCorrect ? (
                  <span className="ml-auto text-[11px] font-semibold text-[#047857]">
                    Đáp án đúng
                  </span>
                ) : isSelected ? (
                  <span className="ml-auto text-[11px] font-semibold text-[#dc2626]">
                    Bạn chọn
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2 text-[13px]">
          <p>{question.analysis.summary}</p>
          {question.analysis.trap ? (
            <p className="text-[#dc2626]">{question.analysis.trap}</p>
          ) : null}
          {question.analysis.notes?.map((note) => (
            <p className="text-[#77716e]" key={note}>
              {note}
            </p>
          ))}
          <p className="font-semibold text-[#398565]">
            {question.analysis.skill}
          </p>
        </div>
      </section>
    </div>
  );
}
