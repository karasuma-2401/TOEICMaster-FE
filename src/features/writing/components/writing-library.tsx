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
import { AttemptHistorySection } from "@/features/history/components/attempt-history-section";
import { WritingHeader } from "./writing-header";

const skill: ExamLibrarySkill = {
  id: "writing",
  name: "Writing",
  tagline:
    "Write sentences based on pictures, respond to emails, and express your opinion in an essay.",
  format: "8 questions · 60 min · 0-200 pts · 3 Parts",
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
  return seconds % 60 ? `${minutes} min ${seconds % 60} sec` : `${minutes} min`;
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
        cause instanceof Error
          ? cause.message
          : "Unable to load Writing tests.",
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
        meta: `${questions} ${questions === 1 ? "question" : "questions"} · ${duration(test)} · 0-200 pts`,
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
      emptyDescription="An admin needs to create and publish a test with 5 Part 1 questions, 2 Part 2 questions, and 1 Part 3 question."
      emptyTitle="No published Writing tests yet"
      error={error}
      header={<WritingHeader wide />}
      historySection={
        <AttemptHistorySection
          description="Your Writing attempts are saved here."
          limit={3}
          skills={["writing"]}
          title="Writing attempt history"
        />
      }
      items={items}
      loading={loading}
      onRetry={() => void load()}
      skill={skill}
    />
  );
}
