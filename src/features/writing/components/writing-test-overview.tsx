"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getWritingTest,
  modeFromRoute,
  startWritingAttempt,
  type WritingTestSummaryApi,
} from "@/features/writing/attempt-api";
import { RuleList, StructureList } from "@/shared/components/practice/briefing";
import { BackLink } from "@/shared/components/practice/page-intro";
import {
  PracticeColumns,
  PracticePage,
} from "@/shared/components/practice/practice-page";
import { StatGrid } from "@/shared/components/practice/stat-grid";
import {
  ErrorPanel,
  InlineError,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  eyebrow,
  primaryAction,
  surfaceCard,
} from "@/shared/components/practice/styles";
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
  return (
    <PracticePage header={<WritingHeader />}>
      <BackLink href="/writing" label="Quay lại thư viện Writing" />
      <div className="mt-6">
        <PracticeColumns
          aside={
            <div className={`space-y-5 p-5 ${surfaceCard}`}>
              <RuleList
                id="test-rules"
                rules={[
                  "Mỗi câu có pha chuẩn bị và pha làm bài riêng.",
                  "Hết thời gian hoặc bấm Next, câu hiện tại sẽ bị khóa.",
                  "Bài được autosave trên server trong khi làm và tự nộp sau câu cuối.",
                ]}
              />
              {error && <InlineError>{error}</InlineError>}
              <button
                className={`w-full ${primaryAction}`}
                disabled={starting}
                onClick={() => void start()}
                type="button"
              >
                {starting ? "Đang tạo lượt làm…" : "Bắt đầu làm bài"}
              </button>
            </div>
          }
          main={
            <div className={`overflow-hidden ${surfaceCard}`}>
              <div className="border-b border-slate-100 bg-gradient-to-br from-orange-50/80 via-white to-white p-6 sm:p-9">
                <p className={eyebrow}>
                  {selectedPart ? "LUYỆN THEO PART" : "FULL WRITING TEST"}
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                  {test.title}
                </h1>
                <p className="mt-3 max-w-prose leading-7 text-slate-600">
                  {test.description}
                </p>
                <div className="mt-7">
                  <StatGrid
                    items={[
                      { label: "Cấu trúc", value: `${questionCount} câu` },
                      {
                        label: "Thời lượng",
                        value: formatDuration(totalSeconds),
                      },
                    ]}
                  />
                </div>
              </div>
              <div className="p-6 sm:p-9">
                <StructureList
                  id="test-structure"
                  items={visibleParts.map((part) => ({
                    key: part.part,
                    badge: part.part,
                    title: `Writing Part ${part.part}`,
                    detail: `${part.questionCount} câu · Chuẩn bị ${part.preparationSeconds}s · Làm bài ${formatDuration(part.responseSeconds)}`,
                  }))}
                />
              </div>
            </div>
          }
        />
      </div>
    </PracticePage>
  );
}
