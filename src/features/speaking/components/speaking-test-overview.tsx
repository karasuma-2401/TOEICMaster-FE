"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getSpeakingTest,
  type SpeakingTestSummary,
} from "@/features/speaking/api";
import {
  partTimingLabel,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
import {
  modeFromRoute,
  modeParts,
  routeFromMode,
} from "@/features/speaking/practice";
import { RuleList, StructureList } from "@/shared/components/practice/briefing";
import { BackLink } from "@/shared/components/practice/page-intro";
import {
  PracticeColumns,
  PracticePage,
} from "@/shared/components/practice/practice-page";
import { StatGrid } from "@/shared/components/practice/stat-grid";
import {
  ErrorPanel,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  eyebrow,
  primaryAction,
  surfaceCard,
} from "@/shared/components/practice/styles";
import { formatMinutes } from "@/shared/ui/format-time";
import { SpeakingHeader } from "./speaking-header";

export function SpeakingTestOverview({
  testId,
  mode,
}: {
  testId: string;
  mode?: string;
}) {
  const [test, setTest] = useState<SpeakingTestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedMode = modeFromRoute(mode);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        setTest(await getSpeakingTest(testId, signal));
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải đề Speaking.",
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

  if (!test && !error)
    return (
      <PracticePage header={<SpeakingHeader />}>
        <LoadingPanel label="Đang tải đề Speaking…" />
      </PracticePage>
    );
  if (!test)
    return (
      <PracticePage header={<SpeakingHeader />}>
        <BackLink href="/speaking" label="Quay lại thư viện" />
        <ErrorPanel
          message={error}
          onRetry={() => void load()}
          retryLabel="Thử tải lại"
        />
      </PracticePage>
    );

  const parts = modeParts(selectedMode);
  const visibleParts = test.parts.filter((part) => parts.includes(part.part));
  const questionCount = visibleParts.reduce(
    (total, part) => total + part.questionCount,
    0,
  );
  const totalSeconds = visibleParts.reduce(
    (total, part) => total + part.durationSeconds,
    0,
  );
  return (
    <PracticePage header={<SpeakingHeader />}>
      <BackLink href="/speaking" label="Quay lại thư viện Speaking" />
      <div className="mt-6">
        <PracticeColumns
          aside={
            <div className={`space-y-5 p-5 ${surfaceCard}`}>
              <RuleList
                id="speaking-rules"
                rules={[
                  "Trình duyệt sẽ xin quyền micro trước khi bắt đầu.",
                  "Mỗi câu có pha chuẩn bị, sau đó tự động ghi âm trong pha trả lời.",
                  "Hết thời gian, câu hiện tại được khóa và chuyển sang câu kế tiếp.",
                  "Bản ghi chỉ lưu trong tab hiện tại để bạn nghe lại cuối bài.",
                ]}
              />
              <Link
                className={`w-full ${primaryAction}`}
                href={`/speaking/tests/${encodeURIComponent(test.id)}/practice?mode=${routeFromMode(selectedMode)}`}
              >
                Bắt đầu làm bài
              </Link>
            </div>
          }
          main={
            <div className={`overflow-hidden ${surfaceCard}`}>
              <div className="border-b border-slate-100 bg-gradient-to-br from-orange-50/80 via-white to-white p-6 sm:p-9">
                <p className={eyebrow}>
                  {selectedMode === "FULL"
                    ? "FULL SPEAKING TEST"
                    : "LUYỆN THEO PART"}
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                  {test.title}
                </h1>
                <p className="mt-3 max-w-prose leading-7 text-slate-600">
                  {test.description}
                </p>
                <div className="mt-7">
                  <StatGrid
                    className="sm:grid-cols-3"
                    items={[
                      { label: "Cấu trúc", value: `${questionCount} câu` },
                      {
                        label: "Thời lượng",
                        value: formatMinutes(totalSeconds),
                      },
                      { label: "Hình thức", value: "Ghi âm qua micro" },
                    ]}
                  />
                </div>
              </div>
              <div className="p-6 sm:p-9">
                <StructureList
                  id="speaking-structure"
                  items={visibleParts.map((part) => ({
                    key: part.part,
                    badge: part.part,
                    title: `Speaking Part ${part.part} · ${speakingPartSpecs[part.part].subtitle}`,
                    detail: `${part.questionCount} câu · ${partTimingLabel(part.part)}`,
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
