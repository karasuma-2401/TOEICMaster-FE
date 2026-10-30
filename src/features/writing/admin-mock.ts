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

const seededQuestions: AdminWritingQuestion[] = [
  ...[
    "walk / while",
    "presentation / listen",
    "carry / box",
    "talk / phone",
    "wait / bus",
    "cook / kitchen",
  ].map((keywords, index): Part1Question => ({
    id: `wp1-${index + 1}`,
    code: `WP1-${String(index + 1).padStart(3, "0")}`,
    part: 1,
    topic: index % 2 === 0 ? "Công việc" : "Đời sống",
    difficulty: index < 2 ? "Dễ" : index < 5 ? "Trung bình" : "Khó",
    status: index === 5 ? "DRAFT" : "PUBLISHED",
    updatedAtLabel: "17/10/2026, 11:30",
    imageName: `writing-part-1-${index + 1}.jpg`,
    imageAlt: "Ảnh minh họa cho câu Writing Part 1",
    keywordOne: keywords.split(" / ")[0],
    keywordTwo: keywords.split(" / ")[1],
    rubricNotes:
      "Dùng đúng hai từ gợi ý, cấu trúc câu rõ ràng và ngữ pháp phù hợp.",
    modelAnswer:
      "A woman is walking her dog in the park while the weather is pleasant.",
  })),
  ...[
    "Planning the annual company picnic",
    "Feedback on our software",
    "Requesting a meeting room",
  ].map((subject, index): Part2Question => ({
    id: `wp2-${index + 1}`,
    code: `WP2-${String(index + 1).padStart(3, "0")}`,
    part: 2,
    topic: index === 1 ? "Chăm sóc khách hàng" : "Công việc",
    difficulty: index === 0 ? "Trung bình" : "Dễ",
    status: "PUBLISHED",
    updatedAtLabel: "16/10/2026, 09:15",
    sender: index === 1 ? "Customer Care" : "Mark Davis (Event Coordinator)",
    recipient: index === 1 ? "Support Team" : "All Staff Members",
    subject,
    emailBody:
      "Dear team,\n\nPlease read the request below and write a complete email response. Include all required details and maintain an appropriate professional tone.",
    directions:
      "In your email, respond clearly, provide the requested information and use a polite closing.",
    rubricNotes:
      "Đáp ứng đủ yêu cầu, bố cục email, mức độ rõ ràng và ngôn ngữ phù hợp.",
    modelAnswer:
      "Dear Mr. Davis,\n\nThank you for your message. I would be happy to help with the plan...",
  })),
  ...[
    "Remote work improves employee productivity. Do you agree or disagree?",
    "Universities should require students to volunteer. What is your opinion?",
  ].map((prompt, index): Part3Question => ({
    id: `wp3-${index + 1}`,
    code: `WP3-${String(index + 1).padStart(3, "0")}`,
    part: 3,
    topic: index === 0 ? "Quản trị doanh nghiệp" : "Giáo dục",
    difficulty: "Khó",
    status: "PUBLISHED",
    updatedAtLabel: "15/10/2026, 16:20",
    prompt,
    minimumWordCount: 300,
    outline:
      "1. Mở bài: nêu quan điểm\n2. Thân bài 1: lý do và ví dụ\n3. Thân bài 2: phát triển lập luận\n4. Kết luận",
    rubricNotes:
      "Quan điểm rõ ràng, bố cục mạch lạc, phát triển ý và độ chính xác ngôn ngữ.",
    modelAnswer:
      "In my opinion, remote work can improve productivity when companies provide clear goals...",
  })),
];

let questions = seededQuestions;
let tests: AdminWritingTest[] = [
  {
    id: "admin-writing-test-01",
    code: "WRT-2026-01",
    title: "TOEIC Writing Practice Test 01",
    description: "Đề Writing đầy đủ cấu trúc 5/2/1.",
    status: "PUBLISHED",
    timingTemplateId: "toeic-writing-standard",
    questionIds: {
      1: ["wp1-1", "wp1-2", "wp1-3", "wp1-4", "wp1-5"],
      2: ["wp2-1", "wp2-2"],
      3: ["wp3-1"],
    },
    updatedAtLabel: "17/10/2026, 11:30",
  },
];

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
  const byPart = (part: WritingPart, count: number) =>
    questions
      .filter(
        (question) => question.part === part && question.status === "PUBLISHED",
      )
      .slice(0, count)
      .map((question) => question.id);
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
    if (test.questionIds[part].length !== expected[part])
      errors.push(`Part ${part} phải có đúng ${expected[part]} câu.`);
    for (const id of test.questionIds[part]) {
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
