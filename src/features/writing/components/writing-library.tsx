"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  totalWritingQuestions,
  totalWritingSeconds,
  writingContentSummaries,
  writingTests,
} from "@/features/writing/mock-data";
import type { WritingDifficulty } from "@/features/writing/types";
import { WritingHeader } from "./writing-header";

const difficultyOptions: Array<WritingDifficulty | "Tất cả"> = [
  "Tất cả",
  "Dễ",
  "Trung bình",
  "Khó",
];

function formatDuration(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} phút`;
}

export function WritingLibrary() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<WritingDifficulty | "Tất cả">(
    "Tất cả",
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
  const visibleTests = useMemo(
    () =>
      writingTests.filter(
        (test) =>
          (difficulty === "Tất cả" || test.difficulty === difficulty) &&
          (!normalizedQuery ||
            `${test.code} ${test.title} ${test.description}`
              .toLocaleLowerCase("vi-VN")
              .includes(normalizedQuery)),
      ),
    [difficulty, normalizedQuery],
  );

  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold tracking-[0.16em] text-orange-600">
            TOEIC WRITING
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Luyện Writing theo đúng từng dạng bài
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
            Chọn luyện từng Part để củng cố kỹ năng, hoặc làm Full Test để mô
            phỏng bài thi Writing theo thời gian.
          </p>
        </div>

        <section aria-labelledby="writing-parts" className="mt-9">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" id="writing-parts">
                Luyện theo Part
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chọn một dạng bài cần tập trung trước khi làm đề tổng hợp.
              </p>
            </div>
            <span className="hidden rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 sm:inline">
              3 Part
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {writingContentSummaries.map((part) => (
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
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {part.exerciseCount} bài tập
                  </span>
                  <Link
                    className="text-sm font-bold text-orange-700 underline decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-orange-600"
                    href={`/writing/tests/${writingTests[0].id}?mode=part-${part.part}`}
                  >
                    Luyện Part {part.part}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="writing-tests" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" id="writing-tests">
                Đề Writing
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Dữ liệu minh họa cho CP1; kết nối API thật sẽ có ở checkpoint
                sau.
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
              Full Test
            </span>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_11rem]">
            <label className="block">
              <span className="sr-only">Tìm đề Writing</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo mã đề hoặc tên đề..."
                type="search"
                value={query}
              />
            </label>
            <label className="block">
              <span className="sr-only">Lọc theo độ khó</span>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                onChange={(event) =>
                  setDifficulty(
                    event.target.value as WritingDifficulty | "Tất cả",
                  )
                }
                value={difficulty}
              >
                {difficultyOptions.map((option) => (
                  <option key={option} value={option}>
                    Độ khó: {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visibleTests.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <h3 className="font-bold">Không tìm thấy đề phù hợp</h3>
              <p className="mt-2 text-sm text-slate-500">
                Thử đổi từ khóa hoặc chọn lại độ khó.
              </p>
              <button
                className="mt-4 text-sm font-bold text-orange-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-orange-600"
                onClick={() => {
                  setQuery("");
                  setDifficulty("Tất cả");
                }}
                type="button"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {visibleTests.map((test) => (
                <article
                  className="flex min-h-72 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={test.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold tracking-[0.1em] text-orange-600">
                      {test.code}
                    </span>
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                      {test.difficulty}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold">{test.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {test.description}
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-3 text-xs">
                    <div>
                      <dt className="text-slate-500">Cấu trúc</dt>
                      <dd className="mt-1 font-bold">
                        {totalWritingQuestions(test)} câu · 3 Part
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Thời lượng</dt>
                      <dd className="mt-1 font-bold">
                        {formatDuration(totalWritingSeconds(test))}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-slate-400">
                    {test.updatedAtLabel}
                  </p>
                  <Link
                    className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 text-sm font-bold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
                    href={`/writing/tests/${test.id}?mode=full`}
                  >
                    Xem đề và bắt đầu
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
