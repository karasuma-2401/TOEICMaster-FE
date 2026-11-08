"use client";

import { useCallback, useEffect, useState } from "react";
import { difficultyLabel } from "@/features/speaking/admin-labels";
import {
  getSpeakingExercises,
  type SpeakingExerciseSummary,
} from "@/features/speaking/api";
import {
  partTimingLabel,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
import type { SpeakingPart } from "@/features/speaking/types";
import {
  BackLink,
  CountBadge,
  PageIntro,
  SectionHeading,
} from "@/shared/components/practice/page-intro";
import { PracticePage } from "@/shared/components/practice/practice-page";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import { TestCard } from "@/shared/components/practice/test-card";
import { formatMinutes } from "@/shared/ui/format-time";
import { SpeakingHeader } from "./speaking-header";

/** Published exercises of one Part; each can be practised on its own. */
export function SpeakingPartLibrary({ part }: { part: SpeakingPart }) {
  const spec = speakingPartSpecs[part];
  const [exercises, setExercises] = useState<SpeakingExerciseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        setExercises(await getSpeakingExercises(part, signal));
      } catch (cause) {
        if (signal?.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải bài tập Speaking.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [part],
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
    <PracticePage header={<SpeakingHeader />}>
      <BackLink href="/speaking" label="Quay lại thư viện Speaking" />
      <PageIntro
        description={`${spec.description} ${partTimingLabel(part)}.`}
        eyebrow={`TOEIC SPEAKING · PART ${part}`}
        title={`${spec.subtitle} (${spec.title})`}
      />

      <section aria-labelledby="speaking-part-exercises" className="mt-10">
        <SectionHeading
          aside={
            !loading && !error ? (
              <CountBadge>{exercises.length} bài</CountBadge>
            ) : undefined
          }
          description="Mỗi bài có pha chuẩn bị và pha trả lời tính giờ như bài thi thật."
          id="speaking-part-exercises"
          title="Chọn bài để luyện"
        />
        {loading && <LoadingPanel label="Đang tải bài tập…" />}
        {error && <ErrorPanel message={error} onRetry={() => void load()} />}
        {!loading && !error && exercises.length === 0 && (
          <EmptyPanel
            description="Admin cần tạo và hiển thị bài tập cho Part này."
            title={`Chưa có bài tập Part ${part}`}
          />
        )}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {exercises.map((exercise) => (
            <TestCard
              actionLabel="Bắt đầu luyện"
              code={exercise.code}
              description={spec.description}
              href={`/speaking/exercises/${encodeURIComponent(exercise.id)}/practice`}
              key={exercise.id}
              stats={[
                {
                  label: "Độ khó",
                  value: difficultyLabel[exercise.difficulty],
                },
                {
                  label: "Thời lượng",
                  value: `${exercise.questionCount} câu · ${formatMinutes(exercise.durationSeconds)}`,
                },
              ]}
              title={exercise.topic}
            />
          ))}
        </div>
      </section>
    </PracticePage>
  );
}
