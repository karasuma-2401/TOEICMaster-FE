"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getWritingHistory,
  getWritingTests,
  type WritingAttemptSummaryApi,
  type WritingTestSummaryApi,
} from "@/features/writing/attempt-api";
import {
  ExamLibrary,
  type ExamLibrarySkill,
} from "@/shared/components/practice/exam-library";
import { summarizeExamAttempts } from "@/shared/components/practice/exam-library-model";
import { WritingHeader } from "./writing-header";

const skill: ExamLibrarySkill = {
  id: "writing",
  name: "Writing",
  tagline:
    "Viết câu theo tranh, phản hồi email và trình bày quan điểm trong bài luận.",
  format: "8 câu · 60 phút · 0–200 điểm · 3 Parts",
  maxScore: 200,
  examHref: "/writing",
  exerciseHref: "/writing/practice/1",
};

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
  const [attempts, setAttempts] = useState<WritingAttemptSummaryApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [page, nextAttempts] = await Promise.all([
        getWritingTests(signal, "", 1, 100),
        // Results are an extra: the list stays usable without them.
        getWritingHistory(signal).catch(() => []),
      ]);
      setTests(page.items);
      setAttempts(nextAttempts);
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

  const items = useMemo(() => {
    const results = summarizeExamAttempts(
      attempts.flatMap((attempt) =>
        attempt.testId &&
        !attempt.isPractice &&
        attempt.mode === "FULL" &&
        attempt.status === "SUBMITTED_AWAITING_EVALUATION"
          ? [{ id: attempt.testId, score: attempt.estimatedScore }]
          : [],
      ),
    );
    return tests.map((test) => {
      const questions = test.parts.reduce(
        (total, part) => total + part.questionCount,
        0,
      );
      return {
        id: test.id,
        code: test.code,
        title: test.title,
        badge: `${test.parts.length} Parts`,
        meta: `${questions} câu · ${duration(test)} · 0–200 điểm`,
        action: {
          href: `/writing/tests/${encodeURIComponent(test.id)}?mode=full`,
        },
        sortKey: test.publishedAtUtc,
        difficulty: null,
        attemptCount: results.get(test.id)?.attemptCount ?? 0,
        bestScore: results.get(test.id)?.bestScore ?? null,
      };
    });
  }, [tests, attempts]);

  return (
    <ExamLibrary
      emptyDescription="Admin cần tạo và publish một đề đủ 5 câu Part 1, 2 câu Part 2 và 1 câu Part 3."
      emptyTitle="Chưa có đề Writing được công bố"
      error={error}
      header={<WritingHeader wide />}
      items={items}
      loading={loading}
      onRetry={() => void load()}
      skill={skill}
    />
  );
}
