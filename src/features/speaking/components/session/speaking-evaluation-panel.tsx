"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  getSpeakingAttempt,
  getSpeakingEvaluationAvailability,
  grantSpeakingEvaluationConsent,
} from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import {
  isEvaluationPending,
  isGuestEvaluationLimit,
  type SpeakingEvaluation,
} from "@/features/speaking/evaluation";
import { useAttemptHistory } from "@/features/speaking/hooks/use-attempt-history";
import { formatAttemptNumber, formatDate, formatElapsed } from "../ui/format";
import {
  AlertCircleIcon,
  CheckIcon,
  CircleIcon,
  ClockIcon,
  LoaderIcon,
} from "../ui/icons";
import { SpPage } from "../ui/page";
import {
  Breadcrumb,
  Chip,
  GradingStepper,
  ProgressBar,
  Waveform,
} from "../ui/primitives";
import { SpeakingResultReport } from "./speaking-result-report";

const pollMilliseconds = 5_000;

const tiles = [
  ["01", "Azure Speech", "Analyzes pronunciation, intonation, and stress."],
  ["02", "Gemini", "Grades grammar, vocabulary, and cohesion."],
  [
    "03",
    "Overall Score 0-200",
    "Estimated using ETS criteria, in 10-point increments.",
  ],
];

const reviewHref = (attemptId: string) =>
  `/speaking/attempts/${encodeURIComponent(attemptId)}/review/1`;

function Heading({
  overline,
  title,
  description,
}: {
  overline: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="sp-overline text-(--sp-ink-2)">{overline}</p>
      <h2 className="mt-2 text-[24px] font-semibold leading-8 lg:text-[30px] lg:leading-10">
        {title}
      </h2>
      <p className="mt-1 text-(--sp-ink-2)">{description}</p>
    </>
  );
}

function PipelineRow({
  state,
  children,
}: {
  state: "done" | "active" | "todo";
  children: ReactNode;
}) {
  return (
    <li
      className={`flex items-center gap-3 text-sm ${state === "done" ? "text-(--sp-success)" : state === "todo" ? "text-(--sp-ink-2)" : ""}`}
    >
      {state === "done" && <CheckIcon size={20} />}
      {state === "active" && (
        <LoaderIcon className="animate-spin text-(--sp-brand)" size={20} />
      )}
      {state === "todo" && <CircleIcon size={20} />}
      {children}
    </li>
  );
}

/**
 * AI evaluation of a submitted attempt: explains what is sent where, asks for
 * consent, polls while the job runs and shows the report when it completes.
 */
export function SpeakingEvaluationPanel({
  attempt,
  uploading,
  failedUploads = [],
  onRetryUpload,
}: {
  attempt: SpeakingAttempt;
  /** Recordings still uploading; evaluation must wait for them. */
  uploading: boolean;
  failedUploads?: number[];
  onRetryUpload?: (position: number) => void;
}) {
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(
    attempt.evaluation,
  );
  const [available, setAvailable] = useState<boolean | null>(null);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestLimited, setGuestLimited] = useState(false);
  const { number: attemptNumber } = useAttemptHistory(attempt);
  const hasRecordings = attempt.questions.some(
    (question) => question.recording,
  );

  useEffect(() => {
    const controller = new AbortController();
    getSpeakingEvaluationAvailability(controller.signal)
      .then(setAvailable)
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, []);

  const refresh = useCallback(async () => {
    try {
      setEvaluation((await getSpeakingAttempt(attempt.id)).evaluation);
    } catch {
      // A failed poll keeps the last state; the next tick tries again.
    }
  }, [attempt.id]);
  const pending = isEvaluationPending(evaluation);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => void refresh(), pollMilliseconds);
    return () => window.clearInterval(timer);
  }, [pending, refresh]);

  const requestEvaluation = async () => {
    setSubmitting(true);
    setError(null);
    try {
      setEvaluation(
        (await grantSpeakingEvaluationConsent(attempt.id)).evaluation,
      );
    } catch (cause) {
      if (isGuestEvaluationLimit(cause)) setGuestLimited(true);
      else
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to request AI grading right now.",
        );
    } finally {
      setSubmitting(false);
    }
  };

  if (evaluation?.status === "COMPLETED")
    return <SpeakingResultReport attempt={attempt} evaluation={evaluation} />;

  const saved = attempt.questions.filter((item) => item.recording).length;
  const queued = evaluation?.status === "QUEUED";
  const dataNote = pending
    ? "You have agreed to send your data for AI evaluation of this speaking attempt."
    : guestLimited
      ? "This speaking attempt has not been sent to the AI service."
      : "Data is only sent once you agree to AI grading.";
  const partCount = new Set(attempt.questions.map((item) => item.part)).size;
  // Guest attempts stay with the guest session and are not moved to an account,
  // so login returns to where the learner can start a new attempt.
  const retryPath = attempt.testId
    ? `/speaking/tests/${attempt.testId}`
    : `/speaking/exercises/${attempt.exerciseId}/practice`;
  const canListen = available === false || evaluation?.status === "FAILED";

  return (
    <SpPage narrow>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Practice Tests", href: "/speaking" },
          { label: "Speaking", href: "/speaking" },
          { label: "Test Grading" },
        ]}
      />
      <Chip className="mt-4 uppercase" tone="speak">
        SPEAKING
      </Chip>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-semibold leading-9">
          Speaking Test Grading
        </h1>
        <GradingStepper current={pending ? 2 : 1} />
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1.5fr_0.53fr]">
        <section
          aria-labelledby="speaking-ai-evaluation"
          className="sp-card min-w-0 p-7"
        >
          <h2 className="sr-only" id="speaking-ai-evaluation">
            AI Grading
          </h2>
          {error && (
            <p
              className="mb-4 rounded-xl bg-(--sp-danger-bg) p-3 text-sm font-semibold text-(--sp-danger)"
              role="alert"
            >
              {error}
            </p>
          )}
          {failedUploads.length > 0 && (
            <div className="mb-4 rounded-xl bg-(--sp-danger-bg) p-3 text-sm text-(--sp-danger)">
              <p className="font-semibold">Some recordings failed to upload.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {failedUploads.map((position) => (
                  <button
                    className="sp-btn sp-btn-sm sp-btn-outline"
                    key={position}
                    onClick={() => onRetryUpload?.(position)}
                    type="button"
                  >
                    Retry uploading question {position}
                  </button>
                ))}
              </div>
            </div>
          )}

          {pending ? (
            <div aria-live="polite">
              <Heading
                description="You do not need to re-record. Please keep this page open while the AI evaluates your responses."
                overline="CONSENT RECEIVED · PROCESSING"
                title="AI is listening to and grading your speaking responses (about 20-40 seconds)…"
              />
              <div className="mt-5 rounded-2xl bg-(--sp-subtle) px-8 py-12 lg:pl-[28%]">
                <p className="sp-overline text-(--sp-ink-2)">
                  ANALYZING RECORDINGS
                </p>
                <p className="mt-2 text-2xl font-semibold">Azure Speech</p>
                <Waveform
                  animated
                  bars={40}
                  className="my-3 text-(--sp-brand)"
                />
                <p className="text-[13px] text-(--sp-ink-2)">
                  Analyzing pronunciation, intonation & stress
                </p>
              </div>
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg font-semibold">
                  {queued ? "Queued for grading" : "Grading pronunciation"}
                </p>
                <p className="text-xs text-(--sp-ink-2)">
                  Processing usually takes 15-45 seconds
                </p>
              </div>
              <div className="mt-2">
                <ProgressBar
                  label="Grading progress"
                  value={queued ? 0.1 : 0.4}
                />
              </div>
              <ul className="mt-4 space-y-3">
                <PipelineRow state={queued ? "active" : "done"}>
                  Audio files optimized
                </PipelineRow>
                <PipelineRow state={queued ? "todo" : "active"}>
                  Azure Speech is grading pronunciation…
                </PipelineRow>
                <PipelineRow state="todo">
                  Gemini is preparing to evaluate grammar.
                </PipelineRow>
              </ul>
              {evaluation?.status === "RETRYING" && (
                <p className="mt-3 text-[13px] text-(--sp-warning)">
                  The AI service is busy; the system will automatically retry
                  (attempt {evaluation.retryCount}).
                </p>
              )}
              <p className="mt-4 text-xs text-(--sp-ink-2)">
                Results will appear once all evaluation steps are complete.
              </p>
            </div>
          ) : (
            <>
              <Heading
                description={
                  guestLimited
                    ? "Your speaking attempt has been saved. Log in to get more AI evaluations."
                    : "Get speaking analysis and improvement tips across 3 evaluation steps."
                }
                overline={
                  guestLimited
                    ? "GUEST · 24-HOUR GRADING LIMIT REACHED"
                    : "SPEAKING ATTEMPT READY · CONFIRM BEFORE GRADING"
                }
                title="Submit your speaking attempt for AI evaluation & ETS-aligned score estimate"
              />
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {tiles.map(([number, title, description]) => (
                  <div
                    className="rounded-[14px] bg-(--sp-subtle) p-4"
                    key={number}
                  >
                    <p className="text-[13px] text-(--sp-brand)">{number}</p>
                    <p className="mt-1 text-lg font-semibold">{title}</p>
                    <p className="text-[13px] text-(--sp-ink-2)">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
              {!guestLimited && <hr className="my-6 border-(--sp-line)" />}

              {guestLimited && (
                <>
                  <div
                    className="mt-6 rounded-[14px] border-[1.5px] border-(--sp-warning-line) bg-(--sp-warning-bg) p-5"
                    role="alert"
                  >
                    <div className="flex gap-3">
                      <AlertCircleIcon
                        className="mt-0.5 shrink-0 text-(--sp-warning)"
                        size={22}
                      />
                      <div>
                        <p className="font-semibold">
                          Guests are limited to 1 grading per day. Log in to get
                          more evaluations.
                        </p>
                        <p className="mt-1 text-sm">
                          Used 1/1 evaluation in the past 24 hours. This
                          speaking attempt has not been sent to the AI service.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Link
                        className="sp-btn sp-btn-solid"
                        href={`/login?next=${encodeURIComponent(retryPath)}`}
                      >
                        Log in for more evaluations →
                      </Link>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-(--sp-ink-2)">
                    Guest attempts are not transferred to an account. After
                    logging in, start a new attempt to get graded.
                  </p>
                </>
              )}
              {available === null && !evaluation && (
                <p className="text-sm text-(--sp-ink-2)">
                  Checking AI grading service…
                </p>
              )}
              {available === false && !evaluation && (
                <div className="rounded-xl bg-(--sp-subtle) p-5 text-sm leading-6">
                  <p className="font-semibold">
                    AI grading for Speaking is not enabled on the server
                  </p>
                  <p className="mt-1 text-(--sp-ink-2)">
                    An administrator needs to configure Azure Speech and Gemini
                    to enable this feature. You can still play back your
                    recordings and self-evaluate.
                  </p>
                </div>
              )}
              {evaluation?.status === "FAILED" && (
                <div className="rounded-[14px] border-[1.5px] border-(--sp-warning-line) bg-(--sp-warning-bg) p-5 text-sm">
                  <p className="font-semibold">Unable to grade right now</p>
                  <p className="mt-1">{evaluation.failureMessage}</p>
                  <button
                    className="sp-btn sp-btn-solid mt-4"
                    disabled={submitting}
                    onClick={() => void requestEvaluation()}
                    type="button"
                  >
                    {submitting ? "Submitting…" : "Retry grading"}
                  </button>
                </div>
              )}
              {available && !evaluation && !hasRecordings && !guestLimited && (
                <p className="text-sm font-semibold text-(--sp-warning)">
                  This attempt has no recordings yet and cannot be graded.
                </p>
              )}
              {available && !evaluation && hasRecordings && !guestLimited && (
                <>
                  <label className="flex min-h-20 items-center gap-3 rounded-xl border border-(--sp-line) p-4 text-sm">
                    <input
                      checked={consented}
                      className="size-5 shrink-0 accent-(--sp-brand)"
                      onChange={(event) => setConsented(event.target.checked)}
                      type="checkbox"
                    />
                    I agree to send my audio recordings and spoken transcripts
                    to AI services for estimated scoring.
                  </label>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-2 text-[13px] text-(--sp-ink-2)">
                      <ClockIcon size={16} />
                      {uploading
                        ? "Waiting for recordings to finish uploading to the server…"
                        : "Processing usually takes about 15-45 seconds"}
                    </p>
                    <button
                      className="sp-btn sp-btn-solid"
                      disabled={!consented || submitting || uploading}
                      onClick={() => void requestEvaluation()}
                      type="button"
                    >
                      {submitting
                        ? "Submitting request…"
                        : "Agree & Start AI Grading →"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        <aside className="min-w-0 space-y-4">
          <section className="sp-card p-5">
            <h2 className="text-lg font-semibold">Your speaking attempt</h2>
            <p className="mt-3 font-semibold">{attempt.testTitle}</p>
            <p className="text-xs text-(--sp-ink-2)">
              {formatDate(attempt.createdAtUtc)}
              {attemptNumber !== null &&
                ` · Attempt ${formatAttemptNumber(attemptNumber)}`}
            </p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-(--sp-ink-2)">Responses</dt>
                <dd>
                  {saved} / {attempt.questions.length} questions
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-(--sp-ink-2)">Content</dt>
                <dd>
                  {partCount > 1
                    ? `${partCount} Parts`
                    : `Part ${attempt.questions[0]?.part}`}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-(--sp-ink-2)">Duration</dt>
                <dd>
                  {formatElapsed(attempt.createdAtUtc, attempt.submittedAtUtc)}
                </dd>
              </div>
            </dl>
            <hr className="my-3 border-(--sp-line)" />
            <p className="flex items-center gap-1.5 text-[13px]">
              <CheckIcon className="text-(--sp-success)" size={15} />
              Recordings completed
            </p>
            {canListen && (
              <Link
                className="sp-btn sp-btn-sm sp-btn-outline mt-3 w-full"
                href={reviewHref(attempt.id)}
              >
                Review & listen back
              </Link>
            )}
          </section>
          <section className="sp-card p-5">
            <h2 className="font-semibold">Data transparency</h2>
            <p className="mt-2 text-[13px] text-(--sp-ink-2)">
              Audio recordings are sent to Azure Speech; spoken transcripts are
              analyzed by Gemini to generate feedback and an estimated score.
            </p>
            <p className="mt-2 text-xs text-(--sp-ink-2)">{dataNote}</p>
          </section>
        </aside>
      </div>
      <p className="mt-8 text-center text-[13px] text-(--sp-ink-2)">
        AI scores are for reference only based on ETS criteria and do not
        replace official test results.
      </p>
    </SpPage>
  );
}
