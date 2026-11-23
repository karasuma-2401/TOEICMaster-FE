"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getLrPracticeDetail,
  submitLrPractice,
  type LrPracticeDetailApi,
  type LrPracticeSubmitResultApi,
} from "@/features/lr-exam/api";
import { UserMenu } from "@/features/user/components/user-menu";

type Skill = "listening" | "reading";

type Props = {
  skill: Skill;
  part: string;
  itemId: string;
};

const partTitles: Record<number, string> = {
  1: "Photographs",
  2: "Question - Response",
  3: "Short Conversations",
  4: "Short Talks",
  5: "Incomplete Sentences",
  6: "Text Completion",
  7: "Reading Comprehension",
};

export function ListeningReadingPracticeDetail({ skill, part, itemId }: Props) {
  const [detail, setDetail] = useState<LrPracticeDetailApi | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<LrPracticeSubmitResultApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await getLrPracticeDetail(itemId, signal);

        if (data.part !== Number(part)) {
          throw new Error(
            "Practice item does not belong to the selected Part.",
          );
        }

        if (signal?.aborted) return;
        setDetail(data);
        setError(null);
      } catch (cause) {
        if (signal?.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load practice content.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [itemId, part],
  );

  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(
      () => void fetchDetail(controller.signal),
      0,
    );

    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [fetchDetail]);

  function handleRetry() {
    setLoading(true);
    setError(null);
    void fetchDetail();
  }

  function selectAnswer(questionId: string, key: string) {
    if (result || submitting) return;

    setAnswers((current) => ({
      ...current,
      [questionId]: key,
    }));
  }

  async function handleSubmit() {
    if (!detail || result || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const submitted = await submitLrPractice(
        detail.id,
        detail.questions.map((question) => ({
          questionId: question.id,
          selectedKey: answers[question.id] ?? null,
        })),
      );

      setResult(submitted);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to submit answers. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const resultByQuestion = new Map(
    result?.questions.map((question) => [question.questionId, question]) ?? [],
  );

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = detail?.questions.length ?? 0;

  return (
    <main className="min-h-screen bg-slate-50" id="main-content" tabIndex={-1}>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href={`/${skill}/practice/${part}`}
            className="text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            ← Back to practice list
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading practice content...
          </div>
        )}

        {!loading && error && !detail && (
          <div className="rounded-xl border border-red-200 bg-white p-6">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && detail && (
          <>
            <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-medium text-blue-600">
                {skill === "listening" ? "Listening" : "Reading"} · Part {part}
                {partTitles[Number(part)]
                  ? ` · ${partTitles[Number(part)]}`
                  : ""}
              </div>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                {detail.topic || detail.code}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Code: {detail.code} · {totalQuestions}{" "}
                {totalQuestions === 1 ? "question" : "questions"}
              </p>

              {!result && (
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span>
                    Answered:{" "}
                    <strong>
                      {answeredCount}/{totalQuestions}
                    </strong>
                  </span>
                  <span>
                    Remaining: <strong>{totalQuestions - answeredCount}</strong>
                  </span>
                </div>
              )}
            </section>

            {detail.audioUrl && (
              <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-3 font-semibold text-slate-900">
                  Listening Audio
                </h2>
                <audio
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  className="w-full"
                  src={detail.audioUrl}
                >
                  <track kind="captions" />
                  Your browser does not support audio playback.
                </audio>
              </section>
            )}

            {detail.imageUrl && (
              <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-3 font-semibold text-slate-900">Image</h2>
                {/* eslint-disable-next-line @next/next/no-img-element -- Presigned MinIO/S3 exam media has dynamic origins and unknown intrinsic dimensions. */}
                <img
                  src={detail.imageUrl}
                  alt="TOEIC practice item"
                  className="mx-auto max-h-96 max-w-full rounded-lg object-contain"
                />
              </section>
            )}

            {detail.context && (
              <section className="mb-6 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-3 font-semibold text-slate-900">Passage</h2>
                <p className="leading-7 text-slate-700">{detail.context}</p>
              </section>
            )}

            <div className="space-y-5">
              {detail.questions.map((question, index) => {
                const questionResult = resultByQuestion.get(question.id);

                const options = [
                  ["A", question.optionA],
                  ["B", question.optionB],
                  ["C", question.optionC],
                  ["D", question.optionD],
                ] as const;

                return (
                  <section
                    key={question.id}
                    className="rounded-xl border border-slate-200 bg-white p-6"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="font-bold text-slate-900">
                        Question {question.ordinal || index + 1}
                      </h2>

                      {questionResult && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            questionResult.isCorrect
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {questionResult.isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      )}
                    </div>

                    {question.code && (
                      <p className="mb-2 text-sm font-medium text-slate-500">
                        {question.code}
                      </p>
                    )}

                    {question.prompt && (
                      <p className="mb-5 whitespace-pre-wrap leading-7 text-slate-800">
                        {question.prompt}
                      </p>
                    )}

                    {detail.imageUrl &&
                      detail.questions.length > 1 &&
                      index === 0 && (
                        <p className="mb-3 text-xs text-slate-500">
                          See the image at the top of this practice item.
                        </p>
                      )}

                    <div className="space-y-3">
                      {options.map(([key, value]) => {
                        if (!value) return null;

                        const selected = answers[question.id] === key;
                        const correct = questionResult?.correctKey === key;
                        const wrongSelected =
                          questionResult?.selectedKey === key &&
                          !questionResult.isCorrect;

                        let optionStyle =
                          "border-slate-200 hover:border-blue-300 hover:bg-blue-50";

                        if (selected && !result) {
                          optionStyle = "border-blue-500 bg-blue-50";
                        }

                        if (result && correct) {
                          optionStyle = "border-green-500 bg-green-50";
                        } else if (result && wrongSelected) {
                          optionStyle = "border-red-400 bg-red-50";
                        }

                        return (
                          <label
                            key={key}
                            className={`flex items-start gap-3 rounded-lg border p-4 transition ${
                              result || submitting
                                ? "cursor-default"
                                : "cursor-pointer"
                            } ${optionStyle}`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={key}
                              checked={selected}
                              disabled={Boolean(result) || submitting}
                              onChange={() => selectAnswer(question.id, key)}
                              className="mt-1 accent-blue-600"
                            />

                            <span className="min-w-0 flex-1 text-sm leading-6 text-slate-700">
                              <strong className="mr-2">{key}.</strong>
                              {value}
                            </span>

                            {result && correct && (
                              <span className="text-xs font-semibold text-green-700">
                                Correct answer
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {questionResult && (
                      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-700">
                          <strong>Your answer:</strong>{" "}
                          {questionResult.selectedKey || "Unanswered"}
                        </p>

                        <p className="text-sm text-green-700">
                          <strong>Correct answer:</strong>{" "}
                          {questionResult.correctKey}
                        </p>

                        {questionResult.translation && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                              Translation
                            </h3>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {questionResult.translation}
                            </p>
                          </div>
                        )}

                        {questionResult.explanation && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                              Explanation
                            </h3>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {questionResult.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {error && detail && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <p>{error}</p>
                {/sign in|log in|session/i.test(error) && (
                  <div className="mt-3">
                    <Link
                      href={`/login?next=${encodeURIComponent(`/${skill}/practice/${part}/${encodeURIComponent(itemId)}`)}`}
                      className="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Sign in now →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {result && (
              <section className="mt-6 rounded-xl border border-blue-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Practice Result
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total Questions</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {result.totalQuestions}
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm text-green-700">Correct</p>
                    <p className="mt-1 text-2xl font-bold text-green-700">
                      {result.correctCount}
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-50 p-4">
                    <p className="text-sm text-red-700">Incorrect</p>
                    <p className="mt-1 text-2xl font-bold text-red-700">
                      {result.incorrectCount}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">
                  Accuracy:{" "}
                  <strong>
                    {result.totalQuestions > 0
                      ? Math.round(
                          (result.correctCount / result.totalQuestions) * 100,
                        )
                      : 0}
                    %
                  </strong>
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setAnswers({});
                      setError(null);
                    }}
                    className="inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                  <Link
                    href={`/${skill}/practice/${part}`}
                    className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back to practice list
                  </Link>
                </div>
              </section>
            )}

            {!result && (
              <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
                <p className="mb-2 text-sm text-slate-600">
                  You have answered {answeredCount}/{totalQuestions} questions.
                  Unanswered questions will be marked incorrect upon submission.
                </p>
                <p className="mb-4 text-xs text-slate-400">
                  Note: You need to sign in to submit and save your practice
                  results.
                </p>

                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting || totalQuestions === 0}
                  className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Grading..." : "Submit"}
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
