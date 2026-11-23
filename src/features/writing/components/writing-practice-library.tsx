"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getWritingHistory,
  getWritingPracticeExercises,
  startWritingPractice,
  type WritingAttemptSummaryApi,
  type WritingPracticeExerciseApi,
} from "@/features/writing/attempt-api";
import { ExamLibrary } from "@/shared/components/practice/exam-library";
import {
  difficultyLabels,
  summarizeExamAttempts,
  type ExamDifficulty,
  type ExamSort,
} from "@/shared/components/practice/exam-library-model";
import { WritingHeader } from "./writing-header";

const parts = {
  1: {
    subtitle: "Write sentences based on pictures",
    description:
      "A picture and two required words or phrases for each question.",
  },
  2: {
    subtitle: "Respond to an email",
    description:
      "Read the email, address all prompts, and write an appropriate response.",
  },
  3: {
    subtitle: "Write an opinion essay",
    description:
      "State your opinion, develop supporting arguments, and write a complete essay.",
  },
} as const;

const partNumbers = [1, 2, 3] as const;

// The backend gives Writing exercises no date, so they are ordered by code.
const sortOptions: { value: ExamSort; label: string }[] = [
  { value: "ASC", label: "Code A-Z" },
  { value: "DESC", label: "Code Z-A" },
];

function parseDifficulty(value: string): ExamDifficulty | null {
  const code = value.toUpperCase();
  return code in difficultyLabels ? (code as ExamDifficulty) : null;
}

export function WritingPracticeLibrary({ part }: { part: 1 | 2 | 3 }) {
  const router = useRouter();
  const [exercises, setExercises] = useState<WritingPracticeExerciseApi[]>([]);
  const [attempts, setAttempts] = useState<WritingAttemptSummaryApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const [page, nextAttempts] = await Promise.all([
          getWritingPracticeExercises(part, 1, signal, 100),
          // Results are an extra: the list stays usable without them.
          getWritingHistory(signal).catch(() => []),
        ]);
        setExercises(page.items);
        setAttempts(nextAttempts);
      } catch (cause) {
        if (signal?.aborted) return;
        setError(
          cause instanceof Error ? cause.message : "Unable to load exercises.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [part],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const start = useCallback(
    async (id: string) => {
      setStarting(id);
      setError(null);
      try {
        const attempt = await startWritingPractice(id);
        router.push(`/writing/attempts/${encodeURIComponent(attempt.id)}`);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to start the exercise.",
        );
        setStarting(null);
      }
    },
    [router],
  );

  const items = useMemo(() => {
    // Practice attempts carry the exercise's code, not its id.
    const results = summarizeExamAttempts(
      attempts.flatMap((attempt) =>
        attempt.isPractice && attempt.status === "SUBMITTED_AWAITING_EVALUATION"
          ? [{ id: attempt.testCode, score: attempt.rawScore ?? null }]
          : [],
      ),
    );
    return exercises.map((exercise) => {
      const difficulty = parseDifficulty(exercise.difficulty);
      return {
        id: exercise.id,
        code: exercise.code,
        title: exercise.topic,
        badge: `Part ${part} · ${difficulty ? difficultyLabels[difficulty] : exercise.difficulty}`,
        meta: `1 question · Untimed · Rubric score 0-${part === 1 ? 3 : part === 2 ? 4 : 5}`,
        action: {
          onStart: () => void start(exercise.id),
          starting: starting === exercise.id,
          disabled: starting !== null,
        },
        sortKey: exercise.code,
        difficulty,
        attemptCount: results.get(exercise.code)?.attemptCount ?? 0,
        bestScore: results.get(exercise.code)?.bestScore ?? null,
      };
    });
  }, [exercises, attempts, part, start, starting]);

  return (
    <ExamLibrary
      emptyDescription="An admin needs to publish exercises for this Part."
      emptyTitle={`No exercises in Part ${part} yet`}
      error={error}
      header={<WritingHeader wide />}
      items={items}
      kind="exercise"
      loading={loading}
      onRetry={() => void load()}
      partLinks={partNumbers.map((item) => ({
        href: `/writing/practice/${item}`,
        label: `Part ${item} · ${parts[item].subtitle}`,
        active: item === part,
      }))}
      skill={{
        id: "writing",
        name: "Writing",
        tagline: parts[part].description,
        format: `Part ${part} · ${parts[part].subtitle} · AI feedback`,
        maxScore: part === 1 ? 3 : part === 2 ? 4 : 5,
        examHref: "/writing",
        exerciseHref: "/writing/practice/1",
      }}
      sortOptions={sortOptions}
    />
  );
}
