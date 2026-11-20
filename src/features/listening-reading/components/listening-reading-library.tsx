"use client";

import { useCallback, useEffect, useState } from "react";
import { UserMenu } from "@/features/user/components/user-menu";
import {
  getLrCatalog,
  getLrPracticeItems,
  getLrPracticeStatistics,
  type LrExamCatalogItemApi,
  type LrPracticeItemApi,
  type LrPracticeItemStatisticsApi,
} from "@/features/lr-exam/api";
import {
  ExamLibrary,
  type ExamLibrarySkill,
} from "@/shared/components/practice/exam-library";
import type {
  ExamDifficulty,
  ExamLibraryItem,
} from "@/shared/components/practice/exam-library-model";
import {
  isListeningReadingPart,
  practiceParts,
  type Skill,
} from "@/features/listening-reading/utils/listening-reading-utils";
import { SkillHeader } from "@/shared/components/practice/skill-header";

export { isListeningReadingPart };

const skills = {
  listening: {
    id: "listening",
    name: "Listening",
    tagline: "Luyện nghe theo 4 Part với audio phát liên tục như phòng thi.",
    format: "100 câu · 45 phút · 5–495 điểm · 4 Parts",
    maxScore: 495,
    examHref: "/listening",
    exerciseHref: "/listening/practice/1",
  },
  reading: {
    id: "reading",
    name: "Reading",
    tagline: "Luyện đọc theo 3 Part và quản lý thời gian cho 100 câu hỏi.",
    format: "100 câu · 75 phút · 5–495 điểm · 3 Parts",
    maxScore: 495,
    examHref: "/reading",
    exerciseHref: "/reading/practice/5",
  },
} as const satisfies Record<Skill, ExamLibrarySkill>;

type PartInfo = { title: string; questions: number };

const partsOf = (skill: Skill) =>
  Object.entries(practiceParts[skill]) as [string, PartInfo][];

function toLibraryItem(exam: LrExamCatalogItemApi): ExamLibraryItem {
  return {
    id: exam.examId,
    code: exam.code,
    title: exam.title,
    badge: `Bản ${exam.versionNumber} · Full Test`,
    meta: `${exam.totalQuestions} câu · 120 phút · Listening & Reading`,
    action: { href: `/exams/lr/${exam.examId}` },
    sortKey: exam.publishedAtUtc,
    difficulty: null,
    attemptCount: 0,
    bestScore: null,
  };
}

function toPracticeDifficulty(
  difficulty: string | null,
): ExamDifficulty | null {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "EASY";
    case "medium":
      return "MEDIUM";
    case "hard":
      return "HARD";
    default:
      return null;
  }
}

function toPracticeLibraryItem(
  item: LrPracticeItemApi,
  skill: Skill,
  part: string,
  statistics?: LrPracticeItemStatisticsApi,
): ExamLibraryItem {
  const difficultyLabels: Record<string, string> = {
    easy: "Dễ",
    medium: "Trung bình",
    hard: "Khó",
  };

  const kindLabels: Record<string, string> = {
    single: "Câu hỏi đơn",
    group: "Nhóm câu hỏi",
  };

  const difficulty = item.difficulty?.toLowerCase() ?? "";
  const kind = item.kind.toLowerCase();

  return {
    id: item.id,
    code: item.code,
    title: item.topic?.trim() || item.code,
    badge:
      [difficultyLabels[difficulty], kindLabels[kind]]
        .filter(Boolean)
        .join(" · ") || `Part ${part}`,
    meta: `${item.questionCount} câu hỏi`,
    action: {
      href: `/${skill}/practice/${part}/${encodeURIComponent(item.id)}`,
    },
    sortKey: item.code,
    difficulty: toPracticeDifficulty(item.difficulty),
    attemptCount: statistics?.attemptCount ?? 0,
    bestScore: statistics?.bestScore ?? null,
  };
}

export function ListeningReadingLibrary({ skill }: { skill: Skill }) {
  const [items, setItems] = useState<ExamLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getLrCatalog(controller.signal)
      .then((catalog) => {
        if (controller.signal.aborted) return;
        setError(null);
        setItems(catalog.map(toLibraryItem));
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải danh sách đề thi.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  function handleRetry() {
    setLoading(true);
    setError(null);
    setAttempt((current) => current + 1);
  }

  const name = "Listening & Reading";

  return (
    <ExamLibrary
      emptyDescription={`Hiện chưa có đề thi ${name} nào được công bố. Vui lòng quay lại sau.`}
      emptyTitle={`Chưa có đề thi ${name}`}
      error={error}
      header={<SkillHeader account={<UserMenu />} active="listening" wide />}
      items={items}
      loading={loading}
      onRetry={handleRetry}
      skill={{
        ...skills[skill],
        id: "listening",
        name: "Listening & Reading",
        tagline:
          "Đề thi TOEIC Listening & Reading đầy đủ 200 câu trong 120 phút.",
        format: "200 câu · 120 phút · Listening & Reading",
        maxScore: 990,
        examHref: "/listening",
        exerciseHref:
          skill === "reading" ? "/reading/practice/5" : "/listening/practice/1",
      }}
    />
  );
}

export function ListeningReadingPractice({
  skill,
  part,
}: {
  skill: Skill;
  part: string;
}) {
  const { name } = skills[skill];
  const parts = partsOf(skill);
  const current = parts.find(([number]) => number === part)?.[1];
  const currentKey = `${skill}:${part}`;

  const [itemsState, setItemsState] = useState<{
    key: string;
    items: ExamLibraryItem[];
  } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [errorState, setErrorState] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const items = itemsState?.key === currentKey ? itemsState.items : [];
  const error = errorState?.key === currentKey ? errorState.message : null;
  const loading =
    retrying || (itemsState?.key !== currentKey && error === null);

  const fetchItems = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [result, statistics] = await Promise.all([
          getLrPracticeItems(Number(part), 1, 50, signal),
          getLrPracticeStatistics(Number(part), signal).catch(
            (): LrPracticeItemStatisticsApi[] => [],
          ),
        ]);

        if (signal?.aborted) return;
        setItemsState({
          key: currentKey,
          items: result.items.map((item) =>
            toPracticeLibraryItem(
              item,
              skill,
              part,
              statistics.find((stat) => stat.itemId === item.id),
            ),
          ),
        });
        setErrorState(null);
      } catch (cause) {
        if (signal?.aborted) return;

        setErrorState({
          key: currentKey,
          message:
            cause instanceof Error
              ? cause.message
              : "Không thể tải danh sách bài luyện.",
        });
      } finally {
        if (!signal?.aborted) setRetrying(false);
      }
    },
    [currentKey, part, skill],
  );

  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void fetchItems(controller.signal), 0);

    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [fetchItems]);

  function handleRetry() {
    setRetrying(true);
    setErrorState(null);
    void fetchItems();
  }

  return (
    <ExamLibrary
      emptyDescription={`Hiện chưa có bài luyện ${name} nào được công bố trong Part ${part}.`}
      emptyTitle={`Chưa có bài luyện ${name} Part ${part}`}
      error={error}
      header={<SkillHeader account={<UserMenu />} active={skill} wide />}
      items={items}
      skillLinks={[
        {
          href: "/listening/practice/1",
          label: "Listening",
          active: skill === "listening",
        },
        {
          href: "/reading/practice/5",
          label: "Reading",
          active: skill === "reading",
        },
      ]}
      kind="exercise"
      loading={loading}
      onRetry={handleRetry}
      partLinks={parts.map(([number, info]) => ({
        href: `/${skill}/practice/${number}`,
        label: `Part ${number} · ${info.title}`,
        active: number === part,
      }))}
      skill={{
        ...skills[skill],
        format: `Part ${part} · ${current?.title} · ${current?.questions} câu trong đề thi`,
      }}
    />
  );
}
