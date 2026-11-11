"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSpeakingAttempts,
  getSpeakingExercises,
  type SpeakingAttemptSummary,
  type SpeakingExerciseSummary,
} from "@/features/speaking/api";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { speakingParts, type SpeakingPart } from "@/features/speaking/types";
import {
  ExamLibrary,
  type ExamLibrarySkill,
} from "@/shared/components/practice/exam-library";
import {
  difficultyLabels,
  summarizeExamAttempts,
} from "@/shared/components/practice/exam-library-model";
import { formatMinutes } from "@/shared/ui/format-time";
import { SpeakingHeader } from "./speaking-header";

const unique = (values: number[]) =>
  [...new Set(values)].map((value) => `${value}s`).join(" / ");

const partLinks = (part: SpeakingPart) =>
  speakingParts.map((item) => ({
    href: `/speaking/parts/${item}`,
    label: `Part ${item} · ${speakingPartSpecs[item].subtitle}`,
    active: item === part,
  }));

function skillFor(part: SpeakingPart): ExamLibrarySkill {
  const spec = speakingPartSpecs[part];
  return {
    id: "speaking",
    name: "Speaking",
    tagline: spec.description,
    format: [
      ...(spec.readingSeconds ? [`Đọc tài liệu ${spec.readingSeconds}s`] : []),
      `Chuẩn bị ${unique(spec.preparationSeconds)}`,
      `Trả lời ${unique(spec.responseSeconds)}`,
      `Part ${part}`,
    ].join(" · "),
    maxScore: 200,
    examHref: "/speaking",
    exerciseHref: "/speaking/parts/1",
  };
}

/** Published exercises of one Part; each can be practised on its own. */
export function SpeakingPartLibrary({ part }: { part: SpeakingPart }) {
  const [exercises, setExercises] = useState<SpeakingExerciseSummary[]>([]);
  const [attempts, setAttempts] = useState<SpeakingAttemptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const [nextExercises, nextAttempts] = await Promise.all([
          getSpeakingExercises(part, signal),
          // Results are an extra: the list stays usable without them.
          getSpeakingAttempts(signal).catch(() => []),
        ]);
        setExercises(nextExercises);
        setAttempts(nextAttempts);
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

  const items = useMemo(() => {
    // Opening a practice page creates an attempt with no recording; those are not real tries.
    const results = summarizeExamAttempts(
      attempts.flatMap((attempt) =>
        attempt.exerciseId &&
        attempt.status === "SUBMITTED" &&
        attempt.recordedCount !== 0
          ? [{ id: attempt.exerciseId, score: attempt.estimatedScore }]
          : [],
      ),
    );
    return exercises.map((exercise) => ({
      id: exercise.id,
      code: exercise.code,
      title: exercise.topic,
      badge: `Part ${part} · ${difficultyLabels[exercise.difficulty]}`,
      meta: `${exercise.questionCount} câu · ~${formatMinutes(exercise.durationSeconds)} · 0–200 điểm`,
      action: {
        href: `/speaking/exercises/${encodeURIComponent(exercise.id)}/practice`,
      },
      sortKey: exercise.updatedAtUtc,
      difficulty: exercise.difficulty,
      attemptCount: results.get(exercise.id)?.attemptCount ?? 0,
      bestScore: results.get(exercise.id)?.bestScore ?? null,
    }));
  }, [exercises, attempts, part]);

  return (
    <ExamLibrary
      emptyDescription="Admin cần công bố bài tập cho Part này."
      emptyTitle={`Chưa có bài tập ở Part ${part}`}
      error={error}
      header={<SpeakingHeader wide />}
      items={items}
      kind="exercise"
      loading={loading}
      onRetry={() => void load()}
      partLinks={partLinks(part)}
      skill={skillFor(part)}
    />
  );
}
