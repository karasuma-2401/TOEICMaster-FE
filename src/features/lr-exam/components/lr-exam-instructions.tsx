"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLrOverview, startLrAttempt, type LrOverviewApi } from "../api";
import {
  ExamIcon,
  LearnerNav,
  Pill,
  primaryButton,
  secondaryButton,
} from "./exam-ui";

const rules = [
  {
    index: "01",
    title: "Listening · Questions 1–100",
    body: "The audio plays continuously. You cannot pause or rewind. After moving to Reading, you cannot edit Listening answers.",
  },
  {
    index: "02",
    title: "Reading · Questions 101–200",
    body: "Navigate freely between Reading questions. You can flag questions to review before submitting.",
  },
  {
    index: "03",
    title: "Auto-Submit",
    body: "The server manages your exam timer and automatically submits when time expires.",
  },
];

export function LrExamInstructions({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = useState<LrOverviewApi | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getLrOverview(examId, controller.signal)
      .then(setExam)
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load exam details.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [examId]);

  async function begin() {
    setStarting(true);
    setError(null);
    try {
      // Backend resumes an active attempt or creates a new one.
      const attempt = await startLrAttempt(examId);
      router.push(`/exams/lr/attempts/${attempt.attemptId}/attempt`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to start the exam.",
      );
      setStarting(false);
    }
  }

  const metrics = exam
    ? ([
        {
          icon: "list-checks",
          value: String(exam.totalQuestions),
          label: "questions",
        },
        {
          icon: "timer",
          value: `${exam.durationMinutes} min`,
          label: "test duration",
        },
        {
          icon: "headphones",
          value: `${exam.listeningQuestions} + ${exam.readingQuestions}`,
          label: "Listening & Reading",
        },
        {
          icon: "trophy",
          value: `${exam.minScaledScore}–${exam.maxScaledScore}`,
          label: "ETS Score Scale",
        },
      ] as const)
    : [];

  return (
    <div className="min-h-screen bg-[#faf7f5] text-[#4c4542]">
      <LearnerNav />
      <main
        className="mx-auto flex max-w-[1282px] flex-col gap-6 px-4 py-10 sm:px-12 lg:px-[220px]"
        id="main-content"
        tabIndex={-1}
      >
        <p className="text-[13px] text-[var(--tm-ink-muted)]">
          Home / Mock Tests / {exam?.code ?? "Listening & Reading"}
        </p>
        <section
          aria-labelledby="exam-title"
          className="flex flex-col gap-6 rounded-2xl border border-[#eee9e6] bg-white p-6 sm:p-8"
        >
          <Pill>LISTENING &amp; READING · FULL TEST</Pill>
          <h1 className="text-[32px] leading-tight font-bold" id="exam-title">
            {loading
              ? "Loading exam details…"
              : (exam?.title ?? "Unable to load exam")}
          </h1>

          {exam ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <li
                  className="flex flex-col gap-2 rounded-xl bg-[#faf7f5] p-5"
                  key={metric.label}
                >
                  <ExamIcon name={metric.icon} />
                  <p className="text-2xl leading-tight font-semibold">
                    {metric.value}
                  </p>
                  <p className="text-[13px] text-[var(--tm-ink-muted)]">
                    {metric.label}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          <h2 className="text-lg font-semibold">
            Please read the exam rules carefully before starting
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {rules.map((rule) => (
              <li className="flex flex-col gap-2" key={rule.index}>
                <Pill>{rule.index}</Pill>
                <h3 className="text-[15px] font-semibold">{rule.title}</h3>
                <p className="text-[13px] text-[var(--tm-ink-muted)]">
                  {rule.body}
                </p>
              </li>
            ))}
          </ol>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 text-[13px] ${ready ? "bg-[#e5f4ec]" : "bg-[#faf7f5]"}`}
          >
            <input
              checked={ready}
              className="mt-0.5 size-5 accent-[#398565]"
              onChange={(event) => setReady(event.target.checked)}
              type="checkbox"
            />
            <span>
              I am ready and have confirmed a stable internet connection and
              working headphones
            </span>
          </label>

          {error ? (
            <div
              className="flex flex-col gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              <p>{error}</p>
              {/sign in|log in|session/i.test(error) && (
                <div>
                  <Link
                    href={`/login?next=${encodeURIComponent(`/exams/lr/${examId}`)}`}
                    className="inline-flex items-center rounded-md bg-[var(--tm-brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--tm-brand-hover)]"
                  >
                    Sign in to start exam →
                  </Link>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link className={secondaryButton} href="/listening-reading">
              ← Back to exam list
            </Link>
            <button
              className={primaryButton}
              disabled={!ready || !exam || starting || loading}
              onClick={() => void begin()}
              type="button"
            >
              {starting
                ? "Preparing exam…"
                : exam?.activeAttemptId
                  ? "RESUME EXAM"
                  : "START L&R EXAM"}
            </button>
          </div>
        </section>
        <p className="text-center text-[11px] text-[var(--tm-ink-muted)]">
          Answers are saved on the server · Timer is server-controlled
        </p>
      </main>
    </div>
  );
}
