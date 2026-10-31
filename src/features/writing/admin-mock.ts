import type { WritingDifficulty, WritingPart } from "./types";

export type WritingQuestionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AdminWritingTestStatus = "DRAFT" | "PUBLISHED";

export interface WritingQuestionBase {
  id: string;
  code: string;
  topic: string;
  difficulty: WritingDifficulty;
  status: WritingQuestionStatus;
  updatedAtLabel: string;
  rubricNotes: string;
  modelAnswer: string;
}

export interface Part1Question extends WritingQuestionBase {
  part: 1;
  imageName: string;
  imageAlt: string;
  keywordOne: string;
  keywordTwo: string;
}

export interface Part2Question extends WritingQuestionBase {
  part: 2;
  sender: string;
  recipient: string;
  subject: string;
  emailBody: string;
  directions: string;
}

export interface Part3Question extends WritingQuestionBase {
  part: 3;
  prompt: string;
  minimumWordCount: number;
  outline: string;
}

export type AdminWritingQuestion =
  Part1Question | Part2Question | Part3Question;

export interface WritingTimingTemplate {
  id: "toeic-writing-standard";
  label: string;
  description: string;
  values: Record<
    WritingPart,
    { preparationSeconds: number; responseSeconds: number }
  >;
}

export interface AdminWritingTest {
  id: string;
  code: string;
  title: string;
  description: string;
  status: AdminWritingTestStatus;
  timingTemplateId: WritingTimingTemplate["id"];
  questionIds: Record<WritingPart, string[]>;
  updatedAtLabel: string;
}

export interface QuestionFilter {
  part: WritingPart;
  query: string;
  difficulty: WritingDifficulty | "ALL";
  status: WritingQuestionStatus | "ALL";
  page: number;
  pageSize: number;
}

export const timingTemplates: WritingTimingTemplate[] = [
  {
    id: "toeic-writing-standard",
    label: "TOEIC Writing chuẩn (đề xuất)",
    description:
      "Part 1: 30s + 60s · Part 2: 60s + 9 phút · Part 3: 2 phút + 28 phút",
    values: {
      1: { preparationSeconds: 30, responseSeconds: 60 },
      2: { preparationSeconds: 60, responseSeconds: 540 },
      3: { preparationSeconds: 120, responseSeconds: 1680 },
    },
  },
];

let questions: AdminWritingQuestion[] = [];
let tests: AdminWritingTest[] = [];

export function resetAdminMockRepository(
  initialQuestions: AdminWritingQuestion[] = [],
  initialTests: AdminWritingTest[] = [],
) {
  questions = [...initialQuestions];
  tests = [...initialTests];
}

function timestamp() {
  return "Hôm nay, vừa cập nhật";
}

export function getAdminQuestions() {
  return questions;
}

export function getAdminQuestion(id: string) {
  return questions.find((question) => question.id === id);
}

export function saveAdminQuestion(question: AdminWritingQuestion) {
  const exists = questions.some((item) => item.id === question.id);
  const saved = {
    ...question,
    updatedAtLabel: timestamp(),
  } as AdminWritingQuestion;
  questions = exists
    ? questions.map((item) => (item.id === saved.id ? saved : item))
    : [saved, ...questions];
  return saved;
}

export function deleteAdminQuestion(id: string) {
  questions = questions.filter((question) => question.id !== id);
  tests = tests.map((test) => ({
    ...test,
    questionIds: {
      1: test.questionIds[1].filter((questionId) => questionId !== id),
      2: test.questionIds[2].filter((questionId) => questionId !== id),
      3: test.questionIds[3].filter((questionId) => questionId !== id),
    },
  }));
}

export function getAdminWritingTests() {
  return tests;
}

export function saveAdminWritingTest(test: AdminWritingTest) {
  const exists = tests.some((item) => item.id === test.id);
  const saved = { ...test, updatedAtLabel: timestamp() };
  tests = exists
    ? tests.map((item) => (item.id === saved.id ? saved : item))
    : [saved, ...tests];
  return saved;
}

export function createAdminTestDraft(): AdminWritingTest {
  const byPart = (part: WritingPart, count: number) => {
    const published = questions
      .filter(
        (question) => question.part === part && question.status === "PUBLISHED",
      )
      .slice(0, count)
      .map((question) => question.id);
    return Array.from({ length: count }, (_, i) => published[i] ?? "");
  };
  return {
    id: `admin-writing-test-${Date.now()}`,
    code: "WRT-2026-NEW",
    title: "TOEIC Writing Practice Test mới",
    description: "",
    status: "DRAFT",
    timingTemplateId: "toeic-writing-standard",
    questionIds: { 1: byPart(1, 5), 2: byPart(2, 2), 3: byPart(3, 1) },
    updatedAtLabel: "Chưa lưu",
  };
}

export function validateTestForPublish(test: AdminWritingTest) {
  const errors: string[] = [];
  if (!test.code.trim()) errors.push("Mã đề là bắt buộc.");
  if (!test.title.trim()) errors.push("Tên đề là bắt buộc.");
  const expected: Record<WritingPart, number> = { 1: 5, 2: 2, 3: 1 };
  const allIds = new Set<string>();
  for (const part of [1, 2, 3] as WritingPart[]) {
    const validPartIds = test.questionIds[part].filter(Boolean);
    if (validPartIds.length !== expected[part])
      errors.push(`Part ${part} phải có đúng ${expected[part]} câu.`);
    for (const id of test.questionIds[part]) {
      if (!id) continue;
      const question = getAdminQuestion(id);
      if (
        !question ||
        question.part !== part ||
        question.status !== "PUBLISHED"
      )
        errors.push(`Part ${part} có câu hỏi không hợp lệ hoặc chưa công bố.`);
      if (allIds.has(id))
        errors.push("Một câu hỏi không thể xuất hiện hai lần trong đề.");
      allIds.add(id);
    }
  }
  return [...new Set(errors)];
}

export function createQuestionId(part: WritingPart) {
  return `wp${part}-${Date.now()}`;
}
