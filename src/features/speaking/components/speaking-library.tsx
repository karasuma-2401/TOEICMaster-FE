"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSpeakingTests,
  type SpeakingTestSummary,
} from "@/features/speaking/api";
import {
  partQuestionCount,
  partTimingLabel,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
import { speakingParts } from "@/features/speaking/types";
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
import { TestCard } from "@/shared/components/practice/test-card";
import { formatMinutes } from "@/shared/ui/format-time";
import { SpeakingHeader } from "./speaking-header";

function totals(test: SpeakingTestSummary) {
  return test.parts.reduce(
    (sum, part) => ({
      questions: sum.questions + part.questionCount,
      seconds: sum.seconds + part.durationSeconds,
    }),
    { questions: 0, seconds: 0 },
  );
}

export function SpeakingLibrary() {
  const [tests, setTests] = useState<SpeakingTestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setTests(await getSpeakingTests(signal));
    } catch (cause) {
      if (signal?.aborted) return;
      setError(
        cause instanceof Error ? cause.message : "Không thể tải đề Speaking.",
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
    <PracticePage header={<SpeakingHeader />}>
      <PageIntro
        description="Mỗi câu có pha chuẩn bị và pha trả lời riêng như bài thi thật. Bạn trả lời bằng micro, nghe lại bản ghi và tự đánh giá sau mỗi lượt luyện."
        eyebrow="TOEIC SPEAKING"
        title="Luyện Speaking theo đúng nhịp thi"
      />

      <section className="mt-10" aria-labelledby="speaking-parts">
        <SectionHeading
          aside={<CountBadge>5 Part · 11 câu</CountBadge>}
          description="Chọn một Part để luyện từng bài trong ngân hàng bài tập."
          id="speaking-parts"
          title="Luyện theo Part"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {speakingParts.map((part) => {
            const spec = speakingPartSpecs[part];
            return (
              <PartCard
                actionLabel={`Luyện Part ${part} →`}
                description={spec.description}
                eyebrow={`PART ${part}`}
                href={`/speaking/parts/${part}`}
                key={part}
                meta={`${partQuestionCount(part)} câu · ${partTimingLabel(part)}`}
                part={part}
                title={spec.subtitle}
                unavailableLabel="Chưa có đề công bố"
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="speaking-tests" className="mt-12">
        <SectionHeading
          description="Chỉ hiển thị đề được Admin công bố."
          id="speaking-tests"
          title="Đề Speaking"
        />
        {loading && <LoadingPanel label="Đang tải đề Speaking…" />}
        {error && <ErrorPanel message={error} onRetry={() => void load()} />}
        {!loading && !error && tests.length === 0 && (
          <EmptyPanel
            description="Admin cần tạo và công bố một đề đủ 11 câu cho 5 Part."
            title="Chưa có đề Speaking được công bố"
          />
        )}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {tests.map((test) => {
            const sum = totals(test);
            return (
              <TestCard
                actionLabel="Xem đề và bắt đầu"
                code={test.code}
                description={test.description}
                href={`/speaking/tests/${test.id}?mode=full`}
                key={test.id}
                stats={[
                  { label: "Cấu trúc", value: `${sum.questions} câu · 5 Part` },
                  { label: "Thời lượng", value: formatMinutes(sum.seconds) },
                ]}
                title={test.title}
              />
            );
          })}
        </div>
      </section>
    </PracticePage>
  );
}
