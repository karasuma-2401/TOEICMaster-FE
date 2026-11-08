"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getWritingTests,
  type WritingTestSummaryApi,
} from "@/features/writing/attempt-api";
import {
  CountBadge,
  PageIntro,
  SectionHeading,
} from "@/shared/components/practice/page-intro";
import { PartCard } from "@/shared/components/practice/part-card";
import { PracticePage } from "@/shared/components/practice/practice-page";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import { textLink } from "@/shared/components/practice/styles";
import { TestCard } from "@/shared/components/practice/test-card";
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
  const minutes = Math.floor(seconds / 60);
  return seconds % 60
    ? `${minutes} phút ${seconds % 60} giây`
    : `${minutes} phút`;
}

export function WritingLibrary() {
  const [tests, setTests] = useState<WritingTestSummaryApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const page = await getWritingTests(signal, query, pageNumber);
        setTests(page.items);
        setTotalPages(page.totalPages);
      } catch (cause) {
        if (signal?.aborted) return;
        setError(
          cause instanceof Error ? cause.message : "Không thể tải đề Writing.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [query, pageNumber],
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
    <PracticePage header={<WritingHeader />}>
      <PageIntro
        description="Luyện bài tập theo Part hoặc làm đề thi với thời gian được tính ở máy chủ."
        eyebrow="TOEIC WRITING"
        title="Luyện Writing theo đúng nhịp thi"
      />

      <section className="mt-10" aria-labelledby="writing-parts">
        <SectionHeading
          aside={<CountBadge>3 Part</CountBadge>}
          description="Chọn Part để luyện bài tập trong ngân hàng."
          id="writing-parts"
          title="Luyện theo Part"
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {parts.map((part) => {
            return (
              <PartCard
                actionLabel={`Luyện Part ${part.part} →`}
                description={part.description}
                eyebrow={`WRITING PART ${part.part}`}
                href={`/writing/practice/${part.part}`}
                key={part.part}
                part={part.part}
                title={part.subtitle}
                unavailableLabel="Chưa có đề công bố"
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="writing-tests" className="mt-12">
        <SectionHeading
          aside={
            <Link className={textLink} href="/history/writing">
              Xem lịch sử làm bài
            </Link>
          }
          description="Chỉ hiển thị đề được Admin công bố."
          id="writing-tests"
          title="Đề Writing"
        />
        <label className="mt-5 block max-w-md text-sm font-semibold">
          Tìm đề Writing
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPageNumber(1);
            }}
            placeholder="Mã hoặc tên đề"
          />
        </label>
        {loading && <LoadingPanel label="Đang tải đề Writing…" />}
        {error && <ErrorPanel message={error} onRetry={() => void load()} />}
        {!loading && !error && tests.length === 0 && (
          <EmptyPanel
            description={
              query
                ? "Hãy thử từ khóa khác."
                : "Admin cần tạo và publish một đề đủ 5 câu Part 1, 2 câu Part 2 và 1 câu Part 3."
            }
            title={
              query
                ? "Không tìm thấy đề phù hợp"
                : "Chưa có đề Writing được công bố"
            }
          />
        )}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {tests.map((test) => (
            <TestCard
              actionLabel="Xem đề và bắt đầu"
              code={test.code}
              description={test.description}
              href={`/writing/tests/${test.id}?mode=full`}
              key={test.id}
              stats={[
                {
                  label: "Cấu trúc",
                  value: `${test.parts.reduce(
                    (total, part) => total + part.questionCount,
                    0,
                  )} câu · 3 Part`,
                },
                { label: "Thời lượng", value: duration(test) },
              ]}
              title={test.title}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-5 flex items-center gap-3 text-sm">
            <button
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
              disabled={pageNumber <= 1 || loading}
              onClick={() => setPageNumber(pageNumber - 1)}
              type="button"
            >
              Trang trước
            </button>
            <span>
              Trang {pageNumber}/{totalPages}
            </span>
            <button
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
              disabled={pageNumber >= totalPages || loading}
              onClick={() => setPageNumber(pageNumber + 1)}
              type="button"
            >
              Trang sau
            </button>
          </div>
        )}
      </section>
    </PracticePage>
  );
}
