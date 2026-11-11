"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSpeakingAttempts,
  getSpeakingTests,
  type SpeakingAttemptSummary,
  type SpeakingTestSummary,
} from "@/features/speaking/api";
import {
  ExamLibrary,
  type ExamLibrarySkill,
} from "@/shared/components/practice/exam-library";
import { summarizeExamAttempts } from "@/shared/components/practice/exam-library-model";
import { formatMinutes } from "@/shared/ui/format-time";
import { SpeakingHeader } from "./speaking-header";

const skill: ExamLibrarySkill = {
  id: "speaking",
  name: "Speaking",
  tagline:
    "Luyện phản xạ nói trong phòng thi hai pha và nhận đánh giá theo 5 tiêu chí.",
  format: "11 câu · ~20 phút · 0–200 điểm · 5 Parts",
  maxScore: 200,
  examHref: "/speaking",
  exerciseHref: "/speaking/parts/1",
};

export function SpeakingLibrary() {
  const [tests, setTests] = useState<SpeakingTestSummary[]>([]);
  const [attempts, setAttempts] = useState<SpeakingAttemptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [nextTests, nextAttempts] = await Promise.all([
        getSpeakingTests(signal),
        // Results are an extra: the list stays usable without them.
        getSpeakingAttempts(signal).catch(() => []),
      ]);
      setTests(nextTests);
      setAttempts(nextAttempts);
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

  const items = useMemo(() => {
    const results = summarizeExamAttempts(
      attempts.flatMap((attempt) =>
        attempt.testId &&
        attempt.status === "SUBMITTED" &&
        attempt.mode === "FULL"
          ? [{ id: attempt.testId, score: attempt.estimatedScore }]
          : [],
      ),
    );
    return tests.map((test) => {
      const questions = test.parts.reduce(
        (sum, part) => sum + part.questionCount,
        0,
      );
      const seconds = test.parts.reduce(
        (sum, part) => sum + part.durationSeconds,
        0,
      );
      return {
        id: test.id,
        code: test.code,
        title: test.title,
        badge: `${test.parts.length} Parts`,
        meta: `${questions} câu · ~${formatMinutes(seconds)} · 0–200 điểm`,
        action: {
          href: `/speaking/tests/${encodeURIComponent(test.id)}/practice?mode=full`,
        },
        sortKey: test.publishedAtUtc ?? "",
        difficulty: null,
        attemptCount: results.get(test.id)?.attemptCount ?? 0,
        bestScore: results.get(test.id)?.bestScore ?? null,
      };
    });
  }, [tests, attempts]);

  return (
    <ExamLibrary
      emptyDescription="Admin cần tạo và công bố một đề đủ 11 câu cho 5 Part."
      emptyTitle="Chưa có đề Speaking được công bố"
      error={error}
      header={<SpeakingHeader wide />}
      items={items}
      loading={loading}
      onRetry={() => void load()}
      skill={skill}
    />
  );
}
