"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getWritingTest,
  modeFromRoute,
  startWritingAttempt,
  type WritingTestSummaryApi,
} from "@/features/writing/attempt-api";
import { WritingHeader } from "./writing-header";

function formatDuration(seconds: number) {
  return `${Math.ceil(seconds / 60)} phút`;
}

export function WritingTestOverview({
  testId,
  mode,
}: {
  testId: string;
  mode?: string;
}) {
  const router = useRouter();
  const [test, setTest] = useState<WritingTestSummaryApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const selectedMode = modeFromRoute(mode);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        setTest(await getWritingTest(testId, signal));
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải đề Writing.",
          );
      }
    },
    [testId],
  );
  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load]);

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      const attempt = await startWritingAttempt(testId, selectedMode);
      router.push(`/writing/attempts/${encodeURIComponent(attempt.id)}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể bắt đầu lượt làm bài.",
      );
      setStarting(false);
    }
  };

  if (!test && !error)
    return (
      <div className="min-h-dvh bg-stone-50">
        <WritingHeader />
        <p className="mx-auto max-w-4xl px-5 py-10 text-sm text-slate-500">
          Đang tải đề Writing…
        </p>
      </div>
    );
  if (!test)
    return (
      <div className="min-h-dvh bg-stone-50">
        <WritingHeader />
        <main className="mx-auto max-w-4xl px-5 py-10">
          <div
            aria-live="assertive"
            className="rounded-xl bg-red-50 p-5 text-sm text-red-800"
            role="alert"
          >
            <p>{error}</p>
            <button
              className="mt-3 font-bold underline"
              onClick={() => void load()}
              type="button"
            >
              Thử tải lại
            </button>
          </div>
          <Link
            className="mt-5 inline-block font-bold text-orange-700 underline"
            href="/writing"
          >
            Quay lại thư viện
          </Link>
        </main>
      </div>
    );

  const selectedPart = test.parts.find(
    (part) => selectedMode === `PART_${part.part}`,
  );
  const visibleParts = selectedPart ? [selectedPart] : test.parts;
  const questionCount = visibleParts.reduce(
    (total, part) => total + part.questionCount,
    0,
  );
  const totalSeconds = visibleParts.reduce(
    (total, part) =>
      total +
      part.questionCount * (part.preparationSeconds + part.responseSeconds),
    0,
  );
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:py-14">
        <Link
          className="text-sm font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-orange-600"
          href="/writing"
        >
          ← Quay lại thư viện Writing
        </Link>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
            {selectedPart ? "LUYỆN THEO PART" : "FULL WRITING TEST"}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {test.title}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {test.description}
          </p>
          <dl className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs font-semibold text-slate-500">Cấu trúc</dt>
              <dd className="mt-1 text-lg font-bold">{questionCount} câu</dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs font-semibold text-slate-500">
                Thời lượng
              </dt>
              <dd className="mt-1 text-lg font-bold">
                {formatDuration(totalSeconds)}
              </dd>
            </div>
          </dl>
          <section className="mt-8" aria-labelledby="test-rules">
            <h2 className="font-bold" id="test-rules">
              Quy tắc làm bài
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>Mỗi câu có pha chuẩn bị và pha làm bài riêng.</li>
              <li>Hết thời gian hoặc bấm Next, câu hiện tại sẽ bị khóa.</li>
              <li>
                Bài được autosave trên server trong khi làm và tự nộp sau câu
                cuối.
              </li>
            </ul>
          </section>
          <section className="mt-8" aria-labelledby="test-structure">
            <h2 className="font-bold" id="test-structure">
              Cấu trúc đề
            </h2>
            <ol className="mt-4 space-y-3">
              {visibleParts.map((part) => (
                <li
                  className="flex gap-4 rounded-xl border border-slate-200 p-4"
                  key={part.part}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-50 text-sm font-bold text-orange-700">
                    {part.part}
                  </span>
                  <div>
                    <h3 className="font-semibold">Writing Part {part.part}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {part.questionCount} câu · Chuẩn bị{" "}
                      {part.preparationSeconds}s · Làm bài{" "}
                      {formatDuration(part.responseSeconds)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          {error && (
            <p
              aria-live="assertive"
              className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={starting}
            onClick={() => void start()}
            type="button"
          >
            {starting ? "Đang tạo lượt làm…" : "Bắt đầu làm bài"}
          </button>
        </div>
      </main>
    </div>
  );
}
