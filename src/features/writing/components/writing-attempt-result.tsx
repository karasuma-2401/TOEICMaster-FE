"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readStoredAttempt,
  toAttemptMode,
  type MockWritingAttempt,
} from "@/features/writing/practice-mock";
import { WritingHeader } from "./writing-header";

export function WritingAttemptResult({
  attemptId,
  mode,
}: {
  attemptId: string;
  mode?: string;
}) {
  const [attempt, setAttempt] = useState<MockWritingAttempt | null>(null);
  useEffect(() => {
    const hydration = window.setTimeout(
      () => setAttempt(readStoredAttempt(attemptId, toAttemptMode(mode))),
      0,
    );
    return () => window.clearTimeout(hydration);
  }, [attemptId, mode]);
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
            WRITING RESULT · MOCK
          </p>
          <h1 className="mt-3 text-3xl font-bold">Đã nộp — chờ chấm AI</h1>
          <p className="mt-3 leading-7 text-slate-600">
            AI chưa được tích hợp ở CP3. Lượt làm được lưu local để bạn kiểm tra
            autosave, khóa câu và lịch sử; CP6 mới tạo điểm ước tính cùng
            feedback.
          </p>
          {attempt ? (
            <dl className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-stone-50 p-4">
                <dt className="text-xs text-slate-500">Dạng làm</dt>
                <dd className="mt-1 font-bold">
                  {attempt.mode === "full"
                    ? "Full Test"
                    : `Writing Part ${attempt.mode.at(-1)}`}
                </dd>
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
          ) : (
            <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Không tìm thấy mock attempt trên trình duyệt này.
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
