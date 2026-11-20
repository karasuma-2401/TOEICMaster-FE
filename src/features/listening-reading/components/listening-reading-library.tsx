"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UserMenu } from "@/features/user/components/user-menu";
import {
  getLrAttemptHistory,
  getLrCatalog,
  type LrAttemptHistoryItemApi,
  type LrExamCatalogItemApi,
} from "@/features/lr-exam/api";
import { AttemptHistorySection } from "@/features/history/components/attempt-history-section";
import {
  ExamLibrary,
  type ExamLibrarySkill,
} from "@/shared/components/practice/exam-library";
import type { ExamLibraryItem } from "@/shared/components/practice/exam-library-model";
import { summarizeExamAttempts } from "@/shared/components/practice/exam-library-model";
import { SkillHeader } from "@/shared/components/practice/skill-header";

const skills = {
  listening: {
    id: "listening",
    name: "Listening",
    tagline: "Luyện nghe theo 4 Part với audio phát liên tục như phòng thi.",
    format: "100 câu · 45 phút · 5–495 điểm · 4 Parts",
    maxScore: 990,
    examHref: "/listening",
    exerciseHref: "/listening/practice/1",
  },
  reading: {
    id: "reading",
    name: "Reading",
    tagline: "Luyện đọc theo 3 Part và quản lý thời gian cho 100 câu hỏi.",
    format: "100 câu · 75 phút · 5–495 điểm · 3 Parts",
    maxScore: 990,
    examHref: "/reading",
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
type PracticeSkill = "listening" | "reading";

const practiceParts = {
  listening: {
    1: { title: "Mô tả tranh", questions: 6 },
    2: { title: "Hỏi – đáp", questions: 25 },
    3: { title: "Đoạn hội thoại", questions: 39 },
    4: { title: "Bài nói ngắn", questions: 30 },
  },
  reading: {
    5: { title: "Hoàn thành câu", questions: 30 },
    6: { title: "Hoàn thành đoạn văn", questions: 16 },
    7: { title: "Đọc hiểu", questions: 54 },
  },
} as const;

type PartInfo = { title: string; questions: number };

const partsOf = (skill: PracticeSkill) =>
  Object.entries(practiceParts[skill]) as [string, PartInfo][];

export function isListeningReadingPart(skill: PracticeSkill, part: string) {
  return part in practiceParts[skill];
}

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

export function ListeningReadingLibrary({ skill }: { skill: Skill }) {
  const [catalog, setCatalog] = useState<LrExamCatalogItemApi[]>([]);
  const [attempts, setAttempts] = useState<LrAttemptHistoryItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [nextCatalog, history] = await Promise.all([
        getLrCatalog(signal),
        // History is an extra: the catalog stays usable without it (e.g. 401).
        getLrAttemptHistory({ pageIndex: 1, pageSize: 100 }, signal).catch(
          () => null,
        ),
      ]);
      setCatalog(nextCatalog);
      setAttempts(history?.items ?? []);
    } catch (cause) {
      if (signal?.aborted) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải danh sách đề thi.",
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
      attempts.flatMap((attempt): { id: string; score: number | null }[] =>
        attempt.status === "Completed"
          ? [{ id: attempt.examId, score: attempt.totalScaledScore }]
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
      header={
        <SkillHeader
          account={<UserMenu />}
          active={skill === "listening-reading" ? undefined : skill}
          wide
        />
      }
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
      onRetry={() => void load()}
      skill={skills[skill]}
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

  return (
    <ExamLibrary
      emptyDescription={`Danh sách bài luyện ${name} theo Part chưa có API learner tương ứng ở Backend.`}
      emptyTitle={`Bài luyện ${name} sắp ra mắt`}
      header={<SkillHeader account={<UserMenu />} active={skill} wide />}
      items={[]}
      kind="exercise"
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
