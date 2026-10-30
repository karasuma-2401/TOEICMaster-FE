"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  displayMode,
  getWritingHistory,
  type WritingAttemptSummaryApi,
} from "@/features/writing/attempt-api";
import { PageIntro } from "@/shared/components/practice/page-intro";
import { PracticePage } from "@/shared/components/practice/practice-page";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import { primaryAction, textLink } from "@/shared/components/practice/styles";
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
    <PracticePage header={<WritingHeader active="history" />}>
      <PageIntro
        description="Lịch sử được lưu theo tài khoản đăng nhập hoặc phiên ẩn danh trên trình duyệt hiện tại."
        eyebrow="LỊCH SỬ WRITING"
        title="Lượt làm bài của bạn"
      />
      {loading && <LoadingPanel label="Đang tải lịch sử…" />}
      {error && <ErrorPanel message={error} onRetry={() => void load()} />}
      {!loading && !error && attempts.length === 0 && (
        <EmptyPanel
          action={
            <Link className={primaryAction} href="/writing">
              Khám phá đề Writing
            </Link>
          }
          title="Chưa có lượt làm bài"
        />
      )}
      {!loading && !error && attempts.length > 0 && (
        <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <ul>
            {attempts.map((attempt) => {
              const submitted =
                attempt.status === "SUBMITTED_AWAITING_EVALUATION";
              const score = attempt.estimatedScore;
              return (
                <li
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 transition last:border-0 hover:bg-orange-50/40"
                  key={attempt.id}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      aria-hidden="true"
                      className={`grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-black ${submitted && score !== null ? "bg-gradient-to-br from-red-600 to-orange-500 text-white" : "bg-stone-100 text-slate-500"}`}
                    >
                      {submitted && score !== null ? score : "W"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{attempt.testTitle}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {displayMode(attempt.mode)} · {attempt.questionCount}{" "}
                        câu ·{" "}
                        {new Date(attempt.createdAtUtc).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${submitted ? "bg-orange-50 text-orange-700 ring-orange-100" : "bg-amber-50 text-amber-700 ring-amber-100"}`}
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
                      className={textLink}
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
    </PracticePage>
  );
}
