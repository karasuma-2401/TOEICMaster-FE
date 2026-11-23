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
import { AttemptHistorySection } from "@/features/history/components/attempt-history-section";
import { formatMinutes } from "@/shared/ui/format-time";
import { SpeakingHeader } from "./speaking-header";

const skill: ExamLibrarySkill = {
  id: "speaking",
  name: "Speaking",
  tagline:
    "Practice speaking fluency in a two-phase exam room and get evaluated across 5 criteria.",
  format: "11 questions · ~20 min · 0-200 pts · 5 Parts",
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
        cause instanceof Error
          ? cause.message
          : "Could not load Speaking tests.",
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
        meta: `${questions} questions · ~${formatMinutes(seconds)} · 0-200 pts`,
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
      emptyDescription="An admin needs to create and publish a test with 11 questions across 5 Parts."
      emptyTitle="No published Speaking tests yet"
      error={error}
      header={<SpeakingHeader wide />}
      historySection={
        <AttemptHistorySection
          description="Your Speaking attempts are saved here."
          limit={3}
          skills={["speaking"]}
          title="Speaking Attempt History"
        />
      }
      items={items}
      loading={loading}
      onRetry={() => void load()}
      skill={skill}
    />
  );
}
