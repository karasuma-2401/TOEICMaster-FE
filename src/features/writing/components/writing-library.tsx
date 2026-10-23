"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getWritingTests,
  type WritingTestSummaryApi,
} from "@/features/writing/attempt-api";
import { WritingHeader } from "./writing-header";

const parts = [
  {
    part: 1,
    subtitle: "Viết câu theo tranh",
    description: "Ảnh và hai từ/cụm từ bắt buộc cho mỗi câu.",
  },
  {
    part: 2,
    subtitle: "Viết email phản hồi",
    description: "Đọc email, đáp ứng đầy đủ yêu cầu và viết phản hồi phù hợp.",
  },
  {
    part: 3,
    subtitle: "Viết bài luận quan điểm",
    description:
      "Nêu quan điểm, phát triển lập luận và viết bài luận hoàn chỉnh.",
  },
] as const;

function duration(test: WritingTestSummaryApi) {
  const seconds = test.parts.reduce(
    (total, part) =>
      total +
      part.questionCount * (part.preparationSeconds + part.responseSeconds),
    0,
  );
  return `${Math.ceil(seconds / 60)} phút`;
}

export function WritingLibrary() {
  const [tests, setTests] = useState<WritingTestSummaryApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const page = await getWritingTests(signal);
      setTests(page.items);
    } catch (cause) {
      if (signal?.aborted) return;
      setError(
        cause instanceof Error ? cause.message : "Không thể tải đề Writing.",
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
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
          TOEIC WRITING
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Luyện Writing theo đúng nhịp thi
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Mỗi câu có pha chuẩn bị và làm bài riêng. Đồng hồ được tính ở máy chủ,
          nên tải lại trang hoặc đổi tab không làm thay đổi thời gian.
        </p>

        <section className="mt-10" aria-labelledby="writing-parts">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" id="writing-parts">
                Luyện theo Part
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chọn một đề đã công bố rồi luyện riêng phần bạn cần.
              </p>
            </div>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
              3 Part
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {parts.map((part) => {
              const available = tests[0];
              return (
                <article
                  className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                  key={part.part}
                >
                  <p className="text-xs font-bold tracking-[0.12em] text-orange-600">
                    WRITING PART {part.part}
                  </p>
                  <h3 className="mt-2 text-lg font-bold">{part.subtitle}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                    {part.description}
                  </p>
                  {available ? (
                    <Link
                      className="mt-5 inline-flex text-sm font-bold text-orange-700 underline decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-orange-600"
                      href={`/writing/tests/${available.id}?mode=part-${part.part}`}
                    >
                      Luyện Part {part.part} →
                    </Link>
                  ) : (
                    <p className="mt-5 text-sm font-semibold text-slate-400">
                      Chưa có đề công bố
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="writing-tests" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" id="writing-tests">
                Đề Writing
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chỉ hiển thị đề được Admin công bố.
              </p>
            </div>
            <Link
              className="text-sm font-bold text-orange-700 underline underline-offset-4"
              href="/history/writing"
            >
              Xem lịch sử làm bài
            </Link>
          </div>
          {loading && (
            <p className="mt-5 rounded-2xl bg-white p-6 text-sm text-slate-500">
              Đang tải đề Writing…
            </p>
          )}
          {error && (
            <div
              aria-live="assertive"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              role="alert"
            >
              <p>{error}</p>
              <button
                className="mt-3 font-bold underline underline-offset-4"
                onClick={() => void load()}
                type="button"
              >
                Thử lại
              </button>
            </div>
          )}
          {!loading && !error && tests.length === 0 && (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <h3 className="font-bold">Chưa có đề Writing được công bố</h3>
              <p className="mt-2 text-sm text-slate-500">
                Admin cần tạo và publish một đề đủ 5 câu Part 1, 2 câu Part 2 và
                1 câu Part 3.
              </p>
            </div>
          )}
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {tests.map((test) => (
              <article
                className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                key={test.id}
              >
                <span className="text-xs font-bold tracking-[0.1em] text-orange-600">
                  {test.code}
                </span>
                <h3 className="mt-3 text-lg font-bold">{test.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {test.description}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-3 text-xs">
                  <div>
                    <dt className="text-slate-500">Cấu trúc</dt>
                    <dd className="mt-1 font-bold">
                      {test.parts.reduce(
                        (total, part) => total + part.questionCount,
                        0,
                      )}{" "}
                      câu · 3 Part
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Thời lượng</dt>
                    <dd className="mt-1 font-bold">{duration(test)}</dd>
                  </div>
                </dl>
                <Link
                  className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 text-sm font-bold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
                  href={`/writing/tests/${test.id}?mode=full`}
                >
                  Xem đề và bắt đầu
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
