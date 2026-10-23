"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listStoredAttempts,
  type MockWritingAttempt,
} from "@/features/writing/practice-mock";
import { WritingHeader } from "./writing-header";

export function WritingHistoryPlaceholder() {
  const [attempts, setAttempts] = useState<MockWritingAttempt[]>([]);
  useEffect(() => {
    const hydration = window.setTimeout(
      () => setAttempts(listStoredAttempts()),
      0,
    );
    return () => window.clearTimeout(hydration);
  }, []);
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
          LỊCH SỬ WRITING · MOCK
        </p>
        <h1 className="mt-3 text-3xl font-bold">Lượt làm bài của bạn</h1>
        <p className="mt-2 text-slate-600">
          Lịch sử CP3 được lưu trên trình duyệt hiện tại. CP5 sẽ thay thế bằng
          lịch sử theo tài khoản.
        </p>
        {attempts.length === 0 ? (
          <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-bold">Chưa có lượt làm bài</h2>
            <Link
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white"
              href="/writing"
            >
              Khám phá đề Writing
            </Link>
          </section>
        ) : (
          <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <ul>
              {attempts.map((attempt) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 last:border-0"
                  key={`${attempt.id}:${attempt.mode}`}
                >
                  <div>
                    <p className="font-bold">{attempt.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {attempt.questions.length} câu ·{" "}
                      {new Date(attempt.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${attempt.status === "SUBMITTED" ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {attempt.status === "SUBMITTED"
                        ? "Chờ chấm AI"
                        : "Đang làm"}
                    </span>
                    <Link
                      className="text-sm font-bold text-orange-700 underline"
                      href={`/writing/attempts/${encodeURIComponent(attempt.id)}${attempt.status === "SUBMITTED" ? `/result?mode=${attempt.mode}` : `?mode=${attempt.mode}`}`}
                    >
                      {attempt.status === "SUBMITTED"
                        ? "Xem trạng thái"
                        : "Tiếp tục"}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
