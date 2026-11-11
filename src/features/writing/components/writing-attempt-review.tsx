"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getWritingAttempt,
  getWritingHistory,
  type WritingAttemptApi,
  type WritingAttemptSummaryApi,
} from "@/features/writing/attempt-api";
import { PracticePage } from "@/shared/components/practice/practice-page";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  focusRing,
  primaryAction,
  surfaceCard,
  textLink,
} from "@/shared/components/practice/styles";
import { WritingHeader } from "./writing-header";
import { WritingQuestionPrompt } from "./writing-question-prompt";

const partNames = {
  1: "Write a sentence",
  2: "Respond to email",
  3: "Opinion essay",
} as const;

const greenTag =
  "w-fit rounded-lg bg-[#f1fdf5] px-2.5 py-1 text-xs text-[#2f7d4f]";
const cardHeading = "text-xl font-semibold text-[#3d3935]";
const mutedNote = "text-[13px] text-[#6b655f]";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function attemptLabel(index: number) {
  return `#${String(index + 1).padStart(2, "0")}`;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Submitted full-test attempts of the same test and mode, oldest first. */
function submittedAttempts(
  attempt: WritingAttemptApi,
  history: WritingAttemptSummaryApi[],
) {
  if (attempt.isPractice || !attempt.testId) return [];
  return history
    .filter(
      (item) =>
        item.testId === attempt.testId &&
        item.mode === attempt.mode &&
        !item.isPractice &&
        item.status === "SUBMITTED_AWAITING_EVALUATION",
    )
    .sort(
      (a, b) =>
        Date.parse(a.submittedAtUtc ?? a.createdAtUtc) -
        Date.parse(b.submittedAtUtc ?? b.createdAtUtc),
    );
}

export function WritingAttemptReview({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<WritingAttemptApi | null>(null);
  const [history, setHistory] = useState<WritingAttemptSummaryApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        const [nextAttempt, nextHistory] = await Promise.all([
          getWritingAttempt(attemptId, signal),
          // The list of attempts is an extra: the review works without it.
          getWritingHistory(signal).catch(() => []),
        ]);
        setAttempt(nextAttempt);
        setHistory(nextHistory);
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error ? cause.message : "Không thể tải bài làm.",
          );
      }
    },
    [attemptId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load]);

  if (!attempt)
    return (
      <PracticePage header={<WritingHeader />}>
        {error ? (
          <ErrorPanel
            message={error}
            onRetry={() => void load()}
            retryLabel="Thử tải lại"
          />
        ) : (
          <LoadingPanel label="Đang tải bài làm…" />
        )}
      </PracticePage>
    );

  if (attempt.status === "IN_PROGRESS")
    return (
      <PracticePage header={<WritingHeader />}>
        <EmptyPanel
          action={
            <Link
              className={primaryAction}
              href={`/writing/attempts/${encodeURIComponent(attemptId)}`}
            >
              Tiếp tục làm bài
            </Link>
          }
          description="Bạn có thể xem lại sau khi đã nộp bài."
          title="Bài làm chưa được nộp"
        />
      </PracticePage>
    );

  const current =
    attempt.questions.find((item) => item.position === position) ??
    attempt.questions[0];
  const attempts = submittedAttempts(attempt, history);
  const attemptIndex = attempts.findIndex((item) => item.id === attempt.id);
  const label = attemptIndex >= 0 ? attemptLabel(attemptIndex) : null;
  const submitted = formatDate(attempt.submittedAtUtc);
  const score =
    attempt.mode === "FULL" && !attempt.isPractice
      ? attempt.evaluation?.estimatedScore
      : null;
  const parts = ([1, 2, 3] as const).flatMap((part) => {
    const questions = attempt.questions.filter((item) => item.part === part);
    return questions.length ? [{ part, questions }] : [];
  });
  const answeredCount = attempt.questions.filter((item) =>
    item.answer.trim(),
  ).length;
  const modelAnswer = attempt.reviewQuestions.find(
    (item) => item.position === current?.position,
  )?.modelAnswer;
  const feedback = attempt.evaluation?.feedback.find(
    (item) => item.questionPosition === current?.position,
  );
  const summary = [
    attempt.testTitle,
    label && `Lần thi ${label}`,
    score != null && `${score}/200 điểm ước tính`,
    `Đã nộp ${submitted}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PracticePage
      header={
        <WritingHeader
          center={
            <div>
              <p className="font-semibold text-[#3d3935]">
                {attempt.testTitle} · Xem lại bài làm
              </p>
              <p className="text-xs text-[#6b655f]">
                {label && `Lần thi ${label} · `}
                {submitted} · Chỉ đọc
              </p>
            </div>
          }
        />
      }
    >
      <h1 className="text-[28px] font-semibold leading-9 text-[#3d3935]">
        Xem lại bài viết &amp; Bài văn mẫu
      </h1>
      <p className="mt-2 text-[15px] text-[#6b655f]">{summary}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className={`p-5 ${surfaceCard}`}>
          <h2 className={cardHeading}>Danh sách câu hỏi</h2>
          <p className={`mt-3 ${mutedNote}`}>
            {answeredCount}/{attempt.questions.length} bài viết đã nộp
          </p>
          {parts.map(({ part, questions }) => (
            <div className="mt-4" key={part}>
              <h3 className="text-[13px] text-[#3d3935]">
                Part {part} · {partNames[part]}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {questions.map((item) => {
                  const selected = item.position === current?.position;
                  return (
                    <button
                      aria-label={`Câu ${item.position}`}
                      aria-pressed={selected}
                      className={`size-11 cursor-pointer rounded-xl text-sm font-semibold transition ${focusRing} ${
                        selected
                          ? "border-2 border-[#df5a28] bg-[#fbf0e6] text-[#3d3935]"
                          : item.answer.trim()
                            ? "bg-[#5fa97a] text-white hover:brightness-95"
                            : "border border-[#d8d2cc] bg-white text-[#6b655f]"
                      }`}
                      key={item.position}
                      onClick={() => setPosition(item.position)}
                      type="button"
                    >
                      {item.position}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className={`mt-4 ${mutedNote}`}>
            Ô viền cam: câu đang xem
            <br />
            Chế độ xem lại · Không chỉnh sửa
          </p>

          {attempts.length > 0 && (
            <>
              <h2 className="mt-5 text-base font-semibold text-[#3d3935]">
                Lịch sử lần thi
              </h2>
              <ul className="mt-2 space-y-1 text-[13px] text-[#3d3935]">
                {attempts
                  .map((item, index) => ({ item, index }))
                  .reverse()
                  .map(({ item, index }) => (
                    <li key={item.id}>
                      <Link
                        aria-current={
                          item.id === attempt.id ? "page" : undefined
                        }
                        className={`hover:underline ${focusRing} ${item.id === attempt.id ? "font-semibold text-[#df5a28]" : ""}`}
                        href={`/writing/attempts/${encodeURIComponent(item.id)}/review`}
                      >
                        {attemptLabel(index)} ·{" "}
                        {formatDate(item.submittedAtUtc)} ·{" "}
                        {item.estimatedScore ?? "—"}/200
                      </Link>
                    </li>
                  ))}
              </ul>
              {label && (
                <p className={`mt-3 ${mutedNote}`}>
                  Đang xem dữ liệu của lần thi {label}.
                </p>
              )}
            </>
          )}

          <Link
            className={`mt-5 inline-block ${textLink}`}
            href={`/writing/attempts/${encodeURIComponent(attemptId)}/result`}
          >
            ← Về trang kết quả
          </Link>
        </aside>

        {current && (
          <div className="min-w-0 space-y-5">
            <section className={`p-5 sm:p-6 ${surfaceCard}`}>
              <p className={`${greenTag} uppercase`}>
                Question {current.position} · Part {current.part} ·{" "}
                {partNames[current.part]}
              </p>
              <div className="mt-4">
                <WritingQuestionPrompt question={current} />
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section className={`min-w-0 p-5 sm:p-6 ${surfaceCard}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className={cardHeading}>Bài viết của bạn</h2>
                  <p className={greenTag}>
                    {countWords(current.answer)} từ · Chỉ đọc
                  </p>
                </div>
                <p className={`mt-3 ${mutedNote}`}>
                  Nguyên văn bài nộp cuối cùng · Không tự động sửa nội dung
                </p>
                <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#3d3935]">
                  {current.answer || "Không có câu trả lời."}
                </p>
              </section>

              {modelAnswer ? (
                <section className={`min-w-0 p-5 sm:p-6 ${surfaceCard}`}>
                  <h2 className={cardHeading}>High-score Model Essay</h2>
                  <p className={`mt-3 ${greenTag}`}>BÀI VĂN MẪU · CHUẨN ETS</p>
                  <p className={`mt-3 ${mutedNote}`}>
                    Nội dung tham khảo riêng · Không phải bài viết của học viên
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#3d3935]">
                    {modelAnswer}
                  </p>
                </section>
              ) : (
                <section className={`min-w-0 p-5 sm:p-6 ${surfaceCard}`}>
                  <h2 className={cardHeading}>Nhận xét của AI</h2>
                  {feedback ? (
                    <>
                      <p className={`mt-3 ${greenTag}`}>
                        Điểm tiêu chí AI: {feedback.criterionScore}
                      </p>
                      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#3d3935]">
                        {feedback.feedback}
                      </p>
                      <h3 className="mt-5 font-semibold text-[#3d3935]">
                        Gợi ý chỉnh sửa
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-[#3d3935]">
                        {feedback.suggestedRevision}
                      </p>
                    </>
                  ) : (
                    <p className={`mt-3 ${mutedNote}`}>
                      Chưa có nhận xét cho câu này. Bạn có thể yêu cầu AI chấm
                      bài ở trang kết quả.
                    </p>
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </PracticePage>
  );
}
