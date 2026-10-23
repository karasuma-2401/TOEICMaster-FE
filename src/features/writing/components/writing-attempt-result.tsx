"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  displayMode,
  getWritingAttempt,
  type WritingAttemptApi,
} from "@/features/writing/attempt-api";
import { WritingHeader } from "./writing-header";

export function WritingAttemptResult({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<WritingAttemptApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setAttempt(await getWritingAttempt(attemptId, signal));
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải trạng thái bài làm.",
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
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
            WRITING RESULT
          </p>
          <h1 className="mt-3 text-3xl font-bold">Đã nộp — chờ chấm AI</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Bài làm đã được lưu an toàn trên server. Chức năng AI chấm điểm và
            phản hồi chi tiết sẽ được tích hợp ở checkpoint tiếp theo.
          </p>
          {attempt ? (
            <dl className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-stone-50 p-4">
                <dt className="text-xs text-slate-500">Dạng làm</dt>
                <dd className="mt-1 font-bold">{displayMode(attempt.mode)}</dd>
              </div>
              <div className="rounded-xl bg-stone-50 p-4">
                <dt className="text-xs text-slate-500">Số câu đã nộp</dt>
                <dd className="mt-1 font-bold">
                  {attempt.questions.length} câu
                </dd>
              </div>
              <div className="rounded-xl bg-stone-50 p-4">
                <dt className="text-xs text-slate-500">Trạng thái</dt>
                <dd className="mt-1 font-bold text-orange-700">Chờ chấm AI</dd>
              </div>
            </dl>
          ) : error ? (
            <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
              {error}
            </p>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              Đang tải trạng thái bài làm…
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white"
              href="/history/writing"
            >
              Xem lịch sử
            </Link>
            <Link
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold"
              href="/writing"
            >
              Làm đề khác
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
