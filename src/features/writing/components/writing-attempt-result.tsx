"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  displayMode,
  grantWritingEvaluationConsent,
  getWritingAttempt,
  type WritingAttemptApi,
} from "@/features/writing/attempt-api";
import { PracticePage } from "@/shared/components/practice/practice-page";
import { StatGrid } from "@/shared/components/practice/stat-grid";
import {
  ErrorPanel,
  InlineError,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  eyebrow,
  primaryAction,
  secondaryAction,
  surfaceCard,
} from "@/shared/components/practice/styles";
import { WritingEvaluationReport } from "./writing-evaluation-report";
import { WritingHeader } from "./writing-header";

export function WritingAttemptResult({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<WritingAttemptApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [submittingConsent, setSubmittingConsent] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setAttempt(await getWritingAttempt(attemptId, signal));
        setError(null);
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load attempt status.",
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
  const evaluationStatus = attempt?.evaluation?.status;
  const shouldPoll =
    evaluationStatus === "QUEUED" ||
    evaluationStatus === "PROCESSING" ||
    evaluationStatus === "RETRYING";
  useEffect(() => {
    if (!shouldPoll) return;
    const timer = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(timer);
  }, [load, shouldPoll]);
  const queueEvaluation = async () => {
    setSubmittingConsent(true);
    try {
      setAttempt(await grantWritingEvaluationConsent(attemptId));
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not request AI evaluation right now.",
      );
    } finally {
      setSubmittingConsent(false);
    }
  };
  const evaluation = attempt?.evaluation;
  const needsConsent = !evaluation || evaluation.status === "CONSENT_REQUIRED";
  const isComplete = evaluation?.status === "COMPLETED";
  return (
    <PracticePage header={<WritingHeader />}>
      <section className={`p-7 sm:p-10 ${surfaceCard}`}>
        <p className={eyebrow}>WRITING RESULT</p>
        <h1 className="mt-3 text-3xl font-bold">
          {isComplete ? "Writing Results" : "Writing Attempt Submitted"}
        </h1>
        <p className="mt-3 max-w-prose leading-7 text-slate-600">
          Your response has been saved safely on the server. AI scores are
          estimates for practice only, not official TOEIC/ETS scores.
        </p>
        {attempt ? (
          <div className="mt-7">
            <StatGrid
              className="sm:grid-cols-3"
              items={[
                { label: "Mode", value: displayMode(attempt.mode) },
                {
                  label: "Questions submitted",
                  value: `${attempt.questions.length} ${attempt.questions.length === 1 ? "question" : "questions"}`,
                },
                {
                  label: "Status",
                  value: isComplete
                    ? "Results ready"
                    : needsConsent
                      ? "Awaiting confirmation"
                      : evaluationStatus === "FAILED"
                        ? "Evaluation failed"
                        : "AI grading",
                  accent: true,
                },
              ]}
            />
          </div>
        ) : error ? (
          <ErrorPanel
            message={error}
            onRetry={() => void load()}
            retryLabel="Retry"
          />
        ) : (
          <LoadingPanel label="Loading attempt status…" />
        )}
        {attempt && needsConsent && (
          <section className="mt-7 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <h2 className="font-bold">Submit for AI estimated scoring</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              When you confirm, the prompt, prompt image, and your writing will
              be sent to Gemini to generate an estimated score and feedback.
              With Gemini Free Tier, content may be used to improve the
              provider&apos;s products. Do not include personal information in
              your writing.
            </p>
            <label className="mt-4 flex gap-3 rounded-xl bg-white/70 p-3 text-sm leading-6 text-slate-800 ring-1 ring-orange-100">
              <input
                checked={consented}
                className="mt-1 size-4 accent-orange-600"
                onChange={(event) => setConsented(event.target.checked)}
                type="checkbox"
              />
              <span>
                I agree to send my writing to the AI service for estimated
                scoring.
              </span>
            </label>
            <button
              className={`mt-5 ${primaryAction}`}
              disabled={!consented || submittingConsent}
              onClick={() => void queueEvaluation()}
              type="button"
            >
              {submittingConsent ? "Submitting request…" : "Agree and grade"}
            </button>
            {error && (
              <div className="mt-4">
                <InlineError>{error}</InlineError>
              </div>
            )}
          </section>
        )}
        {attempt && shouldPoll && (
          <section className="mt-7 flex gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950">
            <span
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600"
            />
            <div>
              <h2 className="font-bold">AI is grading your writing</h2>
              <p className="mt-1">
                You can leave this page; your results will be saved. This status
                updates automatically every 5 seconds.
                {evaluationStatus === "RETRYING" &&
                  " The system is retrying because the AI service is busy."}
              </p>
            </div>
          </section>
        )}
        {attempt && evaluation?.status === "FAILED" && (
          <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <h2 className="font-bold">Unable to grade right now</h2>
            <p className="mt-1">{evaluation.failureMessage}</p>
            <button
              className={`mt-4 ${secondaryAction} border-amber-400`}
              disabled={submittingConsent}
              onClick={() => void queueEvaluation()}
              type="button"
            >
              {submittingConsent ? "Sending…" : "Retry grading"}
            </button>
          </section>
        )}
        {attempt && isComplete && evaluation && (
          <WritingEvaluationReport
            evaluation={evaluation}
            partial={attempt.mode !== "FULL" || attempt.isPractice}
            practicePart={
              attempt.isPractice ? attempt.questions[0]?.part : undefined
            }
            questions={attempt.questions}
          />
        )}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <Link className={primaryAction} href="/history">
            View history
          </Link>
          {attempt && (
            <Link
              className={secondaryAction}
              href={`/writing/attempts/${encodeURIComponent(attemptId)}/review`}
            >
              Review writing
            </Link>
          )}
          <Link className={secondaryAction} href="/writing">
            Try another test
          </Link>
        </div>
      </section>
    </PracticePage>
  );
}
