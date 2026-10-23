import type { WritingPart } from "./types";

export type AttemptMode = "full" | "part-1" | "part-2" | "part-3";
export type AttemptPhase = "PREPARING" | "ANSWERING" | "LOCKED";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED";

interface QuestionBase {
  id: string;
  part: WritingPart;
  preparationSeconds: number;
  responseSeconds: number;
}

export interface Part1PracticeQuestion extends QuestionBase {
  part: 1;
  imageLabel: string;
  imageAlt: string;
  keywordOne: string;
  keywordTwo: string;
}

export interface Part2PracticeQuestion extends QuestionBase {
  part: 2;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  directions: string;
}

export interface Part3PracticeQuestion extends QuestionBase {
  part: 3;
  prompt: string;
  minimumWordCount: number;
  outline: string;
}

export type PracticeQuestion =
  Part1PracticeQuestion | Part2PracticeQuestion | Part3PracticeQuestion;

export interface AttemptQuestion {
  question: PracticeQuestion;
  answer: string;
  phase: AttemptPhase;
  phaseStartedAt: number;
  lockedAt?: number;
}

export interface MockWritingAttempt {
  id: string;
  mode: AttemptMode;
  title: string;
  status: AttemptStatus;
  currentIndex: number;
  createdAt: number;
  submittedAt?: number;
  questions: AttemptQuestion[];
}

const part1: Part1PracticeQuestion[] = [
  ["A woman walking a dog in a park", "walk", "while"],
  ["Employees attending a presentation", "presentation", "listen"],
  ["A worker carrying boxes", "carry", "box"],
  ["A customer talking on the phone", "talk", "phone"],
  ["Passengers waiting for a bus", "wait", "bus"],
].map(([imageAlt, keywordOne, keywordTwo], index) => ({
  id: `attempt-p1-${index + 1}`,
  part: 1,
  preparationSeconds: 30,
  responseSeconds: 60,
  imageLabel: `Ảnh minh họa Part 1 · Câu ${index + 1}`,
  imageAlt,
  keywordOne,
  keywordTwo,
}));

const part2: Part2PracticeQuestion[] = [
  {
    id: "attempt-p2-1",
    part: 2,
    preparationSeconds: 60,
    responseSeconds: 540,
    sender: "Mark Davis (Event Coordinator)",
    recipient: "All Staff Members",
    subject: "Planning the Annual Company Picnic",
    body: "Dear team,\n\nWe are beginning to plan our annual company picnic scheduled for next month. Please reply with your thoughts on potential venues and team activities.",
    directions:
      "In your email, suggest a venue, propose one activity and ask one relevant question.",
  },
  {
    id: "attempt-p2-2",
    part: 2,
    preparationSeconds: 60,
    responseSeconds: 540,
    sender: "Customer Care",
    recipient: "Support Team",
    subject: "Feedback on our software",
    body: "Thank you for using our CRM tool. Please let us know if you faced any problems after the latest update and tell us what improvements would be most helpful.",
    directions:
      "Respond to two concerns and provide one clear next step for the customer.",
  },
];

const part3: Part3PracticeQuestion[] = [
  {
    id: "attempt-p3-1",
    part: 3,
    preparationSeconds: 120,
    responseSeconds: 1680,
    prompt:
      "Some people believe that employees should be allowed to work remotely whenever possible. Do you agree or disagree? Give reasons and examples.",
    minimumWordCount: 300,
    outline:
      "Mở bài: nêu quan điểm.\nThân bài 1: lợi ích chính và ví dụ.\nThân bài 2: xử lý một hạn chế.\nKết luận: khẳng định lại quan điểm.",
  },
];

export const allPracticeQuestions: PracticeQuestion[] = [
  ...part1,
  ...part2,
  ...part3,
];

export function toAttemptMode(value: string | undefined): AttemptMode {
  return value === "part-1" || value === "part-2" || value === "part-3"
    ? value
    : "full";
}

export function createMockAttempt(
  id: string,
  mode: AttemptMode,
  now = Date.now(),
): MockWritingAttempt {
  const selected =
    mode === "full"
      ? allPracticeQuestions
      : allPracticeQuestions.filter(
          (question) => question.part === Number(mode.at(-1)),
        );
  return {
    id,
    mode,
    title:
      mode === "full"
        ? "TOEIC Writing Practice Test 01"
        : `Luyện Writing Part ${mode.at(-1)}`,
    status: "IN_PROGRESS",
    currentIndex: 0,
    createdAt: now,
    questions: selected.map((question) => ({
      question,
      answer: "",
      phase: "PREPARING",
      phaseStartedAt: now,
    })),
  };
}

export function updateAttemptAnswer(
  attempt: MockWritingAttempt,
  answer: string,
) {
  if (attempt.status !== "IN_PROGRESS") return attempt;
  return {
    ...attempt,
    questions: attempt.questions.map((item, index) =>
      index === attempt.currentIndex && item.phase === "ANSWERING"
        ? { ...item, answer }
        : item,
    ),
  };
}

export function advanceAttempt(attempt: MockWritingAttempt, now = Date.now()) {
  if (attempt.status !== "IN_PROGRESS") return attempt;
  const current = attempt.questions[attempt.currentIndex];
  if (!current)
    return { ...attempt, status: "SUBMITTED" as const, submittedAt: now };
  if (current.phase === "PREPARING") {
    return {
      ...attempt,
      questions: attempt.questions.map((item, index) =>
        index === attempt.currentIndex
          ? { ...item, phase: "ANSWERING" as const, phaseStartedAt: now }
          : item,
      ),
    };
  }
  const questions = attempt.questions.map((item, index) =>
    index === attempt.currentIndex
      ? { ...item, phase: "LOCKED" as const, lockedAt: now }
      : item,
  );
  const nextIndex = attempt.currentIndex + 1;
  if (nextIndex >= questions.length)
    return {
      ...attempt,
      questions,
      status: "SUBMITTED" as const,
      submittedAt: now,
    };
  questions[nextIndex] = {
    ...questions[nextIndex],
    phase: "PREPARING",
    phaseStartedAt: now,
  };
  return { ...attempt, questions, currentIndex: nextIndex };
}

export function advanceExpiredAttempt(
  attempt: MockWritingAttempt,
  now = Date.now(),
) {
  if (attempt.status !== "IN_PROGRESS") return attempt;
  const current = attempt.questions[attempt.currentIndex];
  if (!current) return advanceAttempt(attempt, now);
  const duration =
    current.phase === "PREPARING"
      ? current.question.preparationSeconds
      : current.question.responseSeconds;
  return current.phase !== "LOCKED" &&
    now - current.phaseStartedAt >= duration * 1000
    ? advanceAttempt(attempt, now)
    : attempt;
}

export function remainingSeconds(
  attempt: MockWritingAttempt,
  now = Date.now(),
) {
  const current = attempt.questions[attempt.currentIndex];
  if (!current || current.phase === "LOCKED") return 0;
  const duration =
    current.phase === "PREPARING"
      ? current.question.preparationSeconds
      : current.question.responseSeconds;
  return Math.max(
    0,
    Math.ceil((current.phaseStartedAt + duration * 1000 - now) / 1000),
  );
}

const storagePrefix = "toeicmaster:writing-attempt:";

export function attemptStorageKey(id: string, mode: AttemptMode) {
  return `${storagePrefix}${id}:${mode}`;
}

export function readStoredAttempt(id: string, mode: AttemptMode) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(attemptStorageKey(id, mode));
    return raw ? (JSON.parse(raw) as MockWritingAttempt) : null;
  } catch {
    return null;
  }
}

export function writeStoredAttempt(attempt: MockWritingAttempt) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(
      attemptStorageKey(attempt.id, attempt.mode),
      JSON.stringify(attempt),
    );
}

export function listStoredAttempts() {
  if (typeof window === "undefined") return [];
  const attempts: MockWritingAttempt[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(storagePrefix)) continue;
    try {
      attempts.push(
        JSON.parse(
          window.localStorage.getItem(key) ?? "",
        ) as MockWritingAttempt,
      );
    } catch {
      /* Ignore an invalid local mock. */
    }
  }
  return attempts.sort((a, b) => b.createdAt - a.createdAt);
}
