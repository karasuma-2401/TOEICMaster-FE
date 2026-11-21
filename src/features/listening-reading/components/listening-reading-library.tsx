"use client";

import { useEffect, useMemo, useState } from "react";
import { AttemptHistorySection } from "@/features/history/components/attempt-history-section";
import {
  isListeningReadingPart,
  practiceParts,
  type Skill as PracticeSkill,
} from "@/features/listening-reading/utils/listening-reading-utils";
import {
  getLrAttemptHistory,
  getLrCatalog,
  getLrPracticeItems,
  getLrPracticeStatistics,
  type LrAttemptHistoryItemApi,
  type LrExamCatalogItemApi,
  type LrPracticeItemApi,
  type LrPracticeItemStatisticsApi,
} from "@/features/lr-exam/api";
import { UserMenu } from "@/features/user/components/user-menu";
import {
  ExamLibrary,
  type ExamLibrarySkill,
} from "@/shared/components/practice/exam-library";
import {
  summarizeExamAttempts,
  type ExamDifficulty,
  type ExamLibraryItem,
} from "@/shared/components/practice/exam-library-model";
import { SkillHeader } from "@/shared/components/practice/skill-header";

export { isListeningReadingPart };

const skills = {
  listening: {
    id: "listening",
    name: "Listening",
    tagline: "Luyện nghe theo 4 Part với audio phát liên tục như phòng thi.",
    format: "100 câu · 45 phút · 5–495 điểm · 4 Parts",
    maxScore: 990,
    examHref: "/listening-reading",
    exerciseHref: "/listening/practice/1",
  },
  reading: {
    id: "reading",
    name: "Reading",
    tagline: "Luyện đọc theo 3 Part và quản lý thời gian cho 100 câu hỏi.",
    format: "100 câu · 75 phút · 5–495 điểm · 3 Parts",
    maxScore: 990,
    examHref: "/listening-reading",
    exerciseHref: "/reading/practice/5",
  },
  "listening-reading": {
    id: "listening",
    name: "Listening & Reading",
    tagline:
      "Làm trọn đề Listening & Reading 200 câu trong 120 phút như kỳ thi thật.",
    format: "200 câu · 120 phút · 10–990 điểm · 7 Parts",
    maxScore: 990,
    examHref: "/listening-reading",
    exerciseHref: "/listening/practice/1",
  },
} as const satisfies Record<string, ExamLibrarySkill>;

type Skill = keyof typeof skills;
type PartInfo = { title: string; questions: number };

const partsOf = (skill: PracticeSkill) =>
  Object.entries(practiceParts[skill]) as [string, PartInfo][];

function toLibraryItem(
  exam: LrExamCatalogItemApi,
  results: Map<string, { attemptCount: number; bestScore: number | null }>,
): ExamLibraryItem {
  const result = results.get(exam.examId);
  return {
    id: exam.examId,
    code: exam.code,
    title: exam.title,
    badge: `Bản ${exam.versionNumber} · Full Test`,
    meta: `${exam.totalQuestions} câu · 120 phút · Listening & Reading`,
    action: { href: `/exams/lr/${exam.examId}` },
    sortKey: exam.publishedAtUtc,
    difficulty: null,
    attemptCount: result?.attemptCount ?? 0,
    bestScore: result?.bestScore ?? null,
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
  skill: PracticeSkill,
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
  const [catalog, setCatalog] = useState<LrExamCatalogItemApi[]>([]);
  const [attempts, setAttempts] = useState<LrAttemptHistoryItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      getLrCatalog(controller.signal),
      // History is an extra: the catalog stays usable without it (e.g. 401).
      Promise.resolve(
        getLrAttemptHistory({ pageIndex: 1, pageSize: 100 }, controller.signal),
      ).catch(() => null),
    ])
      .then(([nextCatalog, history]) => {
        if (controller.signal.aborted) return;
        setError(null);
        setCatalog(nextCatalog);
        setAttempts(history?.items ?? []);
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

  const items = useMemo(() => {
    const results = summarizeExamAttempts(
      attempts.flatMap((entry): { id: string; score: number | null }[] =>
        entry.status === "Completed"
          ? [{ id: entry.examId, score: entry.totalScaledScore }]
          : [],
      ),
    );
    return catalog.map((exam) => toLibraryItem(exam, results));
  }, [catalog, attempts]);

  const { name } = skills[skill];

  return (
    <ExamLibrary
      emptyDescription={`Hiện chưa có đề thi ${name} nào được công bố. Vui lòng quay lại sau.`}
      emptyTitle={`Chưa có đề thi ${name}`}
      error={error}
      header={<SkillHeader account={<UserMenu />} active={skill} wide />}
      historySection={
        <AttemptHistorySection
          description={`Các lần làm đề ${name} được lưu tại đây.`}
          limit={3}
          skills={["lr"]}
          title="Lịch sử làm bài L&R"
        />
      }
      items={items}
      loading={loading}
      onRetry={handleRetry}
      skill={skills[skill]}
      skillLinks={
        skill === "listening-reading"
          ? [
              {
                href: "/listening/practice/1",
                label: "Bài tập Listening",
                active: false,
              },
              {
                href: "/reading/practice/5",
                label: "Bài tập Reading",
                active: false,
              },
            ]
          : undefined
      }
    />
  );
}

export function ListeningReadingPractice({
  skill,
  part,
}: {
  skill: PracticeSkill;
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
  const [attempt, setAttempt] = useState(0);

  const items = itemsState?.key === currentKey ? itemsState.items : [];
  const error = errorState?.key === currentKey ? errorState.message : null;
  const loading =
    retrying || (itemsState?.key !== currentKey && error === null);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      getLrPracticeItems(Number(part), 1, 50, controller.signal),
      Promise.resolve(
        getLrPracticeStatistics(Number(part), controller.signal),
      ).catch((): LrPracticeItemStatisticsApi[] => []),
    ])
      .then(([result, statistics]) => {
        if (controller.signal.aborted) return;
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
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setErrorState({
          key: currentKey,
          message:
            cause instanceof Error
              ? cause.message
              : "Không thể tải danh sách bài luyện.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setRetrying(false);
      });

    return () => controller.abort();
  }, [attempt, currentKey, part, skill]);

  function handleRetry() {
    setRetrying(true);
    setErrorState(null);
    setAttempt((currentAttempt) => currentAttempt + 1);
  }

  return (
    <ExamLibrary
      emptyDescription={`Hiện chưa có bài luyện ${name} nào được công bố trong Part ${part}.`}
      emptyTitle={`Chưa có bài luyện ${name} Part ${part}`}
      error={error}
      header={<SkillHeader account={<UserMenu />} active={skill} wide />}
      items={items}
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
    />
  );
}
