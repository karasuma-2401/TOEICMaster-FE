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
import { SentenceDiffView } from "./sentence-diff-view";
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
  if (!value) return "-";
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
            cause instanceof Error ? cause.message : "Could not load attempt.",
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
            retryLabel="Retry"
          />
        ) : (
          <LoadingPanel label="Loading attempt…" />
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
              Continue attempt
            </Link>
          }
          description="You can review your writing after submitting the attempt."
          title="Attempt not submitted yet"
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
    label && `Attempt ${label}`,
    score != null && `${score}/200 estimated score`,
    `Submitted ${submitted}`,
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
                {attempt.testTitle} · Review attempt
              </p>
              <p className="text-xs text-[#6b655f]">
                {label && `Attempt ${label} · `}
                {submitted} · Read-only
              </p>
            </div>
          }
        />
      }
    >
      <h1 className="text-[28px] font-semibold leading-9 text-[#3d3935]">
        Review Writing &amp; Model Essays
      </h1>
      <p className="mt-2 text-[15px] text-[#6b655f]">{summary}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className={`p-5 ${surfaceCard}`}>
          <h2 className={cardHeading}>Questions</h2>
          <p className={`mt-3 ${mutedNote}`}>
            {answeredCount}/{attempt.questions.length} responses submitted
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
                      aria-label={`Question ${item.position}`}
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
            Orange border: currently viewing
            <br />
            Review mode · Read-only
          </p>

          {attempts.length > 0 && (
            <>
              <h2 className="mt-5 text-base font-semibold text-[#3d3935]">
                Attempt history
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
                        {item.mode === "FULL" && !item.isPractice
                          ? `${item.estimatedScore ?? "-"}/200`
                          : `${item.rawScore ?? "-"}/${item.maxRawScore ?? "-"} criterion score`}
                      </Link>
                    </li>
                  ))}
              </ul>
              {label && (
                <p className={`mt-3 ${mutedNote}`}>
                  Viewing data for attempt {label}.
                </p>
              )}
            </>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <Link
              className={`inline-block ${textLink}`}
              href={`/writing/attempts/${encodeURIComponent(attemptId)}/result`}
            >
              ← Back to results
            </Link>
            <Link className={`inline-block ${textLink}`} href="/history">
              Back to attempt history
            </Link>
          </div>
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

            {(current.part === 1 || current.part === 2) &&
              feedback?.suggestedRevision && (
                <SentenceDiffView
                  original={current.answer}
                  suggested={feedback.suggestedRevision}
                />
              )}

            <div className="grid gap-5 xl:grid-cols-2">
              <section className={`min-w-0 p-5 sm:p-6 ${surfaceCard}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className={cardHeading}>Your response</h2>
                  <p className={greenTag}>
                    {countWords(current.answer)} words · Read-only
                  </p>
                </div>
                <p className={`mt-3 ${mutedNote}`}>
                  Exact final submission · Content is not auto-edited
                </p>
                <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#3d3935]">
                  {current.answer || "No response submitted."}
                </p>
              </section>

              {modelAnswer && (
                <section className={`min-w-0 p-5 sm:p-6 ${surfaceCard}`}>
                  <h2 className={cardHeading}>High-score Model Essay</h2>
                  <p className={`mt-3 ${greenTag}`}>
                    MODEL ESSAY · ETS STANDARD
                  </p>
                  <p className={`mt-3 ${mutedNote}`}>
                    Reference material only · Not the learner&apos;s response
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#3d3935]">
                    {modelAnswer}
                  </p>
                </section>
              )}
            </div>

            <section className={`min-w-0 p-5 sm:p-6 ${surfaceCard}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className={cardHeading}>AI Feedback</h2>
                {feedback && (
                  <p className={greenTag}>
                    AI criterion score: {feedback.criterionScore}
                  </p>
                )}
              </div>
              {feedback ? (
                <>
                  <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#3d3935]">
                    {feedback.feedback}
                  </p>
                  <h3 className="mt-5 font-semibold text-[#3d3935]">
                    Suggested revision
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-[#3d3935]">
                    {feedback.suggestedRevision}
                  </p>
                </>
              ) : (
                <p className={`mt-3 ${mutedNote}`}>
                  No feedback for this question yet. You can request AI grading
                  on the results page.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </PracticePage>
  );
}
