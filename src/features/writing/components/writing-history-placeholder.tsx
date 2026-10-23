"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  displayMode,
  getWritingHistory,
  type WritingAttemptSummaryApi,
} from "@/features/writing/attempt-api";
import { WritingHeader } from "./writing-header";

export function WritingHistoryPlaceholder() {
  const [attempts, setAttempts] = useState<WritingAttemptSummaryApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      setAttempts(await getWritingHistory(signal));
      setError(null);
    } catch (cause) {
      if (!signal?.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải lịch sử Writing.",
        );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
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
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
          LỊCH SỬ WRITING
        </p>
        <h1 className="mt-3 text-3xl font-bold">Lượt làm bài của bạn</h1>
        <p className="mt-2 text-slate-600">
          Lịch sử được lưu theo tài khoản đăng nhập hoặc phiên ẩn danh trên
          trình duyệt hiện tại.
        </p>
        {loading && (
          <p className="mt-7 rounded-3xl bg-white px-6 py-10 text-sm text-slate-500">
            Đang tải lịch sử…
          </p>
        )}
        {error && (
          <div
            aria-live="assertive"
            className="mt-7 rounded-2xl bg-red-50 p-5 text-sm text-red-800"
            role="alert"
          >
            <p>{error}</p>
            <button
              className="mt-3 font-bold underline"
              onClick={() => void load()}
              type="button"
            >
              Thử lại
            </button>
          </div>
        )}
        {!loading && !error && attempts.length === 0 && (
          <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-bold">Chưa có lượt làm bài</h2>
            <Link
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white"
              href="/writing"
            >
              Khám phá đề Writing
            </Link>
          </section>
        )}
        {!loading && !error && attempts.length > 0 && (
          <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <ul>
              {attempts.map((attempt) => {
                const submitted =
                  attempt.status === "SUBMITTED_AWAITING_EVALUATION";
                const score = attempt.estimatedScore;
                return (
                  <li
                    className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 last:border-0"
                    key={attempt.id}
                  >
                    <div>
                      <p className="font-bold">{attempt.testTitle}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {displayMode(attempt.mode)} · {attempt.questionCount}{" "}
                        câu ·{" "}
                        {new Date(attempt.createdAtUtc).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${submitted ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {submitted
                          ? score !== null
                            ? `AI ước tính ${score}/200`
                            : attempt.evaluationStatus === "FAILED"
                              ? "Cần chấm lại"
                              : "Chờ chấm AI"
                          : "Đang làm"}
                      </span>
                      <Link
                        className="text-sm font-bold text-orange-700 underline"
                        href={
                          submitted
                            ? `/writing/attempts/${encodeURIComponent(attempt.id)}/result`
                            : `/writing/attempts/${encodeURIComponent(attempt.id)}`
                        }
                      >
                        {submitted ? "Xem trạng thái" : "Tiếp tục"}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
