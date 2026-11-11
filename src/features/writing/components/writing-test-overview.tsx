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
import { Breadcrumbs } from "@/shared/components/practice/breadcrumbs";
import { BackLink } from "@/shared/components/practice/page-intro";
import { PracticePage } from "@/shared/components/practice/practice-page";
import {
  ErrorPanel,
  InlineError,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  focusRing,
  primaryAction,
  secondaryAction,
  surfaceCard,
} from "@/shared/components/practice/styles";
import { WritingHeader } from "./writing-header";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return seconds % 60
    ? `${minutes} phút ${seconds % 60} giây`
    : `${minutes} phút`;
}

function shortDuration(seconds: number) {
  return seconds <= 60 ? `${seconds}s` : formatDuration(seconds);
}

const partGuides = {
  1: {
    title: "Viết câu theo tranh",
    detail:
      "Dùng cả hai từ khóa để viết một câu mô tả đúng nội dung từng bức tranh. Chú ý cấu trúc và ngữ pháp.",
  },
  2: {
    title: "Phản hồi email",
    detail:
      "Đọc yêu cầu và viết email trả lời đầy đủ các ý được hỏi. Sử dụng văn phong lịch sự, phù hợp ngữ cảnh.",
  },
  3: {
    title: "Bài luận quan điểm",
    detail:
      "Trình bày quan điểm với lý do và ví dụ cụ thể. Khuyến nghị tối thiểu 300 từ, bố cục mở bài, thân bài và kết luận.",
  },
} as const;

const greenTag = "w-fit rounded-lg bg-[#f1fdf5] text-[#2f7d4f]";

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
  const [ready, setReady] = useState(false);
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
      <PracticePage header={<WritingHeader />}>
        <LoadingPanel label="Đang tải đề Writing…" />
      </PracticePage>
    );
  if (!test)
    return (
      <PracticePage header={<WritingHeader />}>
        <BackLink href="/writing" label="Quay lại thư viện" />
        <ErrorPanel
          message={error}
          onRetry={() => void load()}
          retryLabel="Thử tải lại"
        />
      </PracticePage>
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
  const stats = [
    { value: `${questionCount} câu`, label: "tuần tự · khóa sau khi chuyển" },
    selectedPart
      ? { value: `Part ${selectedPart.part}`, label: "luyện riêng một Part" }
      : {
          value: `${test.parts.length} Parts`,
          label: `Part 1–${test.parts.length} · tuần tự`,
        },
    selectedPart
      ? { value: formatDuration(totalSeconds), label: "tổng thời gian" }
      : { value: "0–200", label: "thang điểm ước tính" },
    { value: "Tự động", label: "lưu và khóa sau mỗi câu" },
  ];
  const guides = test.parts.flatMap((part, index) => {
    const first =
      test.parts
        .slice(0, index)
        .reduce((total, item) => total + item.questionCount, 0) + 1;
    const last = first + part.questionCount - 1;
    if (selectedPart && part !== selectedPart) return [];
    return [
      {
        part,
        range: first === last ? `Câu ${first}` : `Câu ${first}–${last}`,
      },
    ];
  });

  return (
    // The bottom space lets the start button scroll clear of the guide mascot.
    <PracticePage className="pb-44 pt-8 lg:pt-10" header={<WritingHeader />}>
      <div className="mx-auto max-w-[1000px]">
        <Breadcrumbs
          items={[
            { label: "Trang chủ", href: "/" },
            { label: selectedPart ? "Bài tập" : "Đề thi thử" },
            { label: "Writing", href: "/writing" },
            { label: test.title },
          ]}
        />
        <div className={`mt-4 p-6 sm:p-8 ${surfaceCard}`}>
          <p className={`${greenTag} px-2.5 py-1 text-xs`}>
            {selectedPart
              ? "WRITING · LUYỆN THEO PART"
              : "WRITING · BÀI THI ĐỘC LẬP"}
          </p>
          <h1 className="mt-4 text-[28px] font-semibold leading-9 text-[#3d3935]">
            {test.title}
          </h1>
          {test.description && (
            <p className="mt-2 max-w-prose text-[15px] leading-6 text-[#6b655f]">
              {test.description}
            </p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div className="rounded-2xl bg-[#f7f6f4] p-5" key={stat.label}>
                <dd className="text-2xl font-semibold text-[#3d3935]">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-sm text-[#6b655f]">{stat.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-lg font-semibold leading-7 text-[#3d3935]">
            {selectedPart ? "Phần luyện tập" : "Bài thi"} gồm {questionCount}{" "}
            câu hỏi tuần tự. Mỗi câu có thời gian chuẩn bị và thời gian làm bài
            riêng. Khi chuyển câu, câu trước sẽ tự động khóa lại vĩnh viễn.
          </p>
          <div
            className={`mt-5 grid gap-6 ${selectedPart ? "" : "md:grid-cols-3"}`}
          >
            {guides.map(({ part, range }, index) => (
              <section key={part.part}>
                <p className={`${greenTag} px-2.5 py-1 text-xs`}>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-base font-semibold text-[#3d3935]">
                  Part {part.part} · {partGuides[part.part].title}
                </h2>
                <p className="mt-2 text-[13px] text-[#6b655f]">
                  {range} · {shortDuration(part.preparationSeconds)} chuẩn bị +{" "}
                  {shortDuration(part.responseSeconds)} viết
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4a4541]">
                  {partGuides[part.part].detail}
                </p>
              </section>
            ))}
          </div>
          <div className="mt-6 flex gap-3 rounded-2xl bg-[#fbf3c8] p-5">
            <svg
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-[#c2761e]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <path d="M12 3 5 5.5v6c0 4.5 2.9 7.8 7 9.5 4.1-1.7 7-5 7-9.5v-6L12 3ZM12 8v4M12 15.5h.01" />
            </svg>
            <div>
              <h2 className="font-semibold text-[#3d3935]">
                Chặn dán nội dung từ bên ngoài · Khóa spellcheck
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#4a4541]">
                Chỉ nhập bài trực tiếp. Không có gợi ý chính tả hoặc ngữ pháp
                trong phòng thi. Bài được lưu tự động và tự khóa sau mỗi câu.
              </p>
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-[#e9f3ec] p-4 text-[15px] text-[#3d3935]">
            <input
              checked={ready}
              className={`size-5 shrink-0 accent-[#3f7a52] ${focusRing}`}
              onChange={(event) => setReady(event.target.checked)}
              type="checkbox"
            />
            Tôi đã đọc quy chế, sẵn sàng làm bài và đảm bảo kết nối mạng ổn
            định.
          </label>
          {error && (
            <div className="mt-4">
              <InlineError>{error}</InlineError>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Link className={secondaryAction} href="/writing">
              ← Về danh sách đề Writing
            </Link>
            <button
              className={primaryAction}
              disabled={!ready || starting}
              onClick={() => void start()}
              type="button"
            >
              {starting ? "Đang tạo lượt làm…" : "BẮT ĐẦU LÀM BÀI WRITING"}
            </button>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-[#6b655f]">
          {!selectedPart && (
            <>
              Tổng thời lượng <span>{formatDuration(totalSeconds)}</span> ·{" "}
            </>
          )}
          Writing có {questionCount} câu tuần tự, khóa sau mỗi câu · Khuyến nghị
          dùng Chrome mới nhất
        </p>
      </div>
    </PracticePage>
  );
}
