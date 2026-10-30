// Backend-shaped JSON for tests only. Never import from application code.

export const ids = {
  exercise: (n: number) =>
    `00000000-0000-0000-0000-0000000000${String(n).padStart(2, "0")}`,
  test: "10000000-0000-0000-0000-000000000001",
  attempt: "20000000-0000-0000-0000-000000000001",
  image: "30000000-0000-0000-0000-000000000001",
};

const contentByPart = {
  1: {
    part: 1,
    passage: "Attention, shoppers. The store closes in thirty minutes.",
  },
  2: {
    part: 2,
    imageAssetId: ids.image,
    imageAlt: "Three colleagues at a meeting table.",
  },
  3: {
    part: 3,
    context:
      "Imagine a marketing firm is interviewing you about reading habits.",
    questions: [
      "How often do you read?",
      "Printed or e-books?",
      "Recommend a book.",
    ],
  },
  4: {
    part: 4,
    documentTitle: "Marketing Conference · May 14",
    documentRows: [
      { label: "9:00", value: "Registration" },
      { label: "9:30", value: "Keynote" },
    ],
    callerIntro: "Hi, I lost my schedule.",
    questions: [
      "Where is it held?",
      "Is lunch in the main hall?",
      "Sessions after lunch?",
    ],
  },
  5: { part: 5, prompt: "Should employees work from home? Give reasons." },
} as const;

export function exerciseDto(part: 1 | 2 | 3 | 4 | 5, overrides: object = {}) {
  return {
    id: ids.exercise(part),
    code: `SP${part}-001`,
    topic: "Công việc",
    difficulty: "MEDIUM",
    status: "PUBLISHED",
    rubricNotes: "Rõ ràng, đúng trọng tâm.",
    modelAnswer: "Sample answer.",
    version: 3,
    updatedAtUtc: "2026-10-20T09:10:00Z",
    ...structuredClone(contentByPart[part]),
    ...overrides,
  };
}

export function pageDto<T>(items: T[]) {
  return {
    items,
    pageNumber: 1,
    pageSize: 20,
    totalCount: items.length,
    totalPages: 1,
  };
}

export const summaryDto = {
  exercises: { total: 12, published: 9, draft: 2, archived: 1 },
  tests: { total: 3, published: 2, draft: 1 },
};

export function testSummaryDto(overrides: object = {}) {
  return {
    id: ids.test,
    code: "SPK-2026-01",
    title: "TOEIC Speaking Practice Test 01",
    description: "Đề đủ 11 câu.",
    publishedAtUtc: "2026-10-20T10:00:00Z",
    parts: [
      { part: 1, questionCount: 2, durationSeconds: 180 },
      { part: 2, questionCount: 2, durationSeconds: 150 },
      { part: 3, questionCount: 3, durationSeconds: 69 },
      { part: 4, questionCount: 3, durationSeconds: 114 },
      { part: 5, questionCount: 1, durationSeconds: 105 },
    ],
    ...overrides,
  };
}

export function testDetailDto(overrides: object = {}) {
  const slots = [
    [1, 1],
    [1, 2],
    [2, 1],
  ] as const;
  return {
    id: ids.test,
    code: "SPK-2026-03",
    title: "Practice Test 03",
    description: "",
    status: "DRAFT",
    version: 2,
    updatedAtUtc: "2026-10-20T10:00:00Z",
    publishedAtUtc: null,
    exercises: slots.map(([part, sequenceNumber]) => ({
      exerciseId: ids.exercise(part * 10 + sequenceNumber),
      part,
      sequenceNumber,
      exercise: exerciseDto(part, {
        id: ids.exercise(part * 10 + sequenceNumber),
      }),
    })),
    ...overrides,
  };
}

export function testListItemDto(overrides: object = {}) {
  return {
    id: ids.test,
    code: "SPK-2026-01",
    title: "Practice Test 01",
    status: "PUBLISHED",
    version: 4,
    updatedAtUtc: "2026-10-20T10:00:00Z",
    publishedAtUtc: "2026-10-20T10:00:00Z",
    partCounts: { "1": 2, "2": 2, "3": 1, "4": 1, "5": 1 },
    questionCount: 11,
    ...overrides,
  };
}

export function attemptDto(overrides: object = {}) {
  return {
    id: ids.attempt,
    testId: ids.test,
    testCode: "SPK-2026-01",
    testTitle: "Practice Test 01",
    mode: "PART_4",
    status: "IN_PROGRESS",
    currentQuestionPosition: 1,
    currentPhase: "READING",
    phaseEndsAtUtc: "2026-10-23T10:00:45Z",
    serverNowUtc: "2026-10-23T10:00:00Z",
    createdAtUtc: "2026-10-23T10:00:00Z",
    submittedAtUtc: null,
    questions: [0, 1, 2].map((questionIndex) => ({
      position: questionIndex + 1,
      part: 4,
      questionIndex,
      readingSeconds: questionIndex === 0 ? 45 : 0,
      preparationSeconds: 3,
      responseSeconds: questionIndex === 2 ? 30 : 15,
      lockedAtUtc: null,
      recording: null,
      content: {
        ...structuredClone(contentByPart[4]),
        questions: [null, null, null],
      },
    })),
    reviewQuestions: [],
    ...overrides,
  };
}
