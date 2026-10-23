import type {
  WritingContentSummary,
  WritingPart,
  WritingTestSummary,
} from "./types";

export const writingContentSummaries: WritingContentSummary[] = [
  {
    part: 1,
    title: "Part 1: Write a sentence based on a picture",
    subtitle: "Viết câu theo tranh",
    exerciseCount: 90,
    description: "Ảnh và hai từ/cụm từ bắt buộc cho mỗi câu.",
  },
  {
    part: 2,
    title: "Part 2: Respond to a written request",
    subtitle: "Viết email phản hồi",
    exerciseCount: 45,
    description: "Đọc email, đáp ứng đầy đủ yêu cầu và viết phản hồi phù hợp.",
  },
  {
    part: 3,
    title: "Part 3: Write an opinion essay",
    subtitle: "Viết bài luận quan điểm",
    exerciseCount: 40,
    description:
      "Nêu quan điểm, phát triển lập luận và viết bài luận hoàn chỉnh.",
  },
];

export const writingTests: WritingTestSummary[] = [
  {
    id: "writing-practice-01",
    code: "WRT-2026-01",
    title: "TOEIC Writing Practice Test 01",
    description:
      "Đề luyện tổng hợp cho người bắt đầu, tập trung vào bố cục email và câu văn rõ ràng.",
    difficulty: "Dễ",
    status: "Published",
    updatedAtLabel: "Cập nhật 17/10/2026",
    parts: [
      {
        part: 1,
        title: "Write a sentence based on a picture",
        questionCount: 5,
        preparationSeconds: 30,
        responseSeconds: 60,
      },
      {
        part: 2,
        title: "Respond to a written request",
        questionCount: 2,
        preparationSeconds: 60,
        responseSeconds: 540,
      },
      {
        part: 3,
        title: "Write an opinion essay",
        questionCount: 1,
        preparationSeconds: 120,
        responseSeconds: 1680,
      },
    ],
  },
  {
    id: "writing-practice-02",
    code: "WRT-2026-02",
    title: "TOEIC Writing Practice Test 02",
    description:
      "Đề luyện trình độ trung bình với ngữ cảnh công sở và yêu cầu phát triển ý rõ ràng.",
    difficulty: "Trung bình",
    status: "Published",
    updatedAtLabel: "Cập nhật 14/10/2026",
    parts: [
      {
        part: 1,
        title: "Write a sentence based on a picture",
        questionCount: 5,
        preparationSeconds: 30,
        responseSeconds: 60,
      },
      {
        part: 2,
        title: "Respond to a written request",
        questionCount: 2,
        preparationSeconds: 60,
        responseSeconds: 540,
      },
      {
        part: 3,
        title: "Write an opinion essay",
        questionCount: 1,
        preparationSeconds: 120,
        responseSeconds: 1680,
      },
    ],
  },
  {
    id: "writing-practice-03",
    code: "WRT-2026-03",
    title: "TOEIC Writing Practice Test 03",
    description:
      "Đề luyện nâng cao, yêu cầu sử dụng từ vựng linh hoạt và phát triển luận điểm thuyết phục.",
    difficulty: "Khó",
    status: "Published",
    updatedAtLabel: "Cập nhật 08/10/2026",
    parts: [
      {
        part: 1,
        title: "Write a sentence based on a picture",
        questionCount: 5,
        preparationSeconds: 30,
        responseSeconds: 60,
      },
      {
        part: 2,
        title: "Respond to a written request",
        questionCount: 2,
        preparationSeconds: 60,
        responseSeconds: 540,
      },
      {
        part: 3,
        title: "Write an opinion essay",
        questionCount: 1,
        preparationSeconds: 120,
        responseSeconds: 1680,
      },
    ],
  },
];

export function getWritingTest(id: string) {
  return writingTests.find((test) => test.id === id);
}

export function totalWritingQuestions(test: WritingTestSummary) {
  return test.parts.reduce((total, part) => total + part.questionCount, 0);
}

export function totalWritingSeconds(test: WritingTestSummary) {
  return test.parts.reduce(
    (total, part) =>
      total +
      part.questionCount * (part.preparationSeconds + part.responseSeconds),
    0,
  );
}

export function getWritingPartSummary(part: WritingPart) {
  return writingContentSummaries.find((summary) => summary.part === part);
}
