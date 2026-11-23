/**
 * Demo content for the L&R exam screens.
 *
 * The backend contract for learner L&R attempts is not part of this repository
 * yet, so the UI reads from these typed fixtures. Replace the loaders in
 * `loaders.ts` with real API calls once the contract exists; the components
 * only depend on the types in `types.ts`.
 */
import { range } from "./session";
import type {
  LrAnswers,
  LrExamSummary,
  LrFlags,
  LrQuestionGroup,
  LrResultReport,
  LrReviewGroup,
  LrReviewStatus,
} from "./types";

export const demoExam: LrExamSummary = {
  id: "ets-2024-test-01",
  title: "TOEIC Full Test 2024 - Test 01",
  identity: "ETS 2024 · Test 01",
  breadcrumb: "Home / ETS Mock Tests / ETS 2024 Test 01",
  totalQuestions: 200,
  durationMinutes: 120,
  scoreScale: "10–990",
};

const emailPassage = {
  label: "EMAIL · Questions 147–149",
  title: "Updated remote working policy",
  meta: "From: Sarah Lee · hr@northstar.com    |    October 24, 2026",
  paragraphs: [
    { text: "Dear colleagues," },
    {
      text: "We are pleased to announce an update to our remote working policy.",
      evidence: true,
    },
    {
      text: "Starting November 1, employees may work from home up to two days a week, with approval from their department manager.",
    },
    {
      text: "Please submit your preferred days through the staff portal by October 28. Our IT team will provide secure access to all required tools.",
    },
  ],
  signature: [
    "Thank you for your continued commitment.",
    "Sarah Lee · Human Resources Director",
  ],
};

export const demoGroups: LrQuestionGroup[] = [
  {
    id: "part3-32-34",
    part: 3,
    first: 32,
    last: 34,
    heading: "PART 3: SHORT CONVERSATIONS · QUESTIONS 32 - 34",
    description: "2-speaker conversation · Listen and answer 3 questions",
    audio: { currentSeconds: 22, totalSeconds: 48 },
    questions: [
      {
        number: 32,
        prompt: "What are the speakers mainly discussing?",
        choices: [
          { key: "A", text: "A client presentation schedule" },
          { key: "B", text: "An upcoming office relocation" },
          { key: "C", text: "New software installation" },
          { key: "D", text: "Budget approval for marketing" },
        ],
      },
      {
        number: 33,
        prompt: "What problem does the woman mention?",
        choices: [
          { key: "A", text: "A delayed shipment of equipment" },
          { key: "B", text: "A broken office elevator" },
          { key: "C", text: "A system error with new software" },
          { key: "D", text: "Network connection error" },
        ],
      },
    ],
  },
  {
    id: "part7-147-149",
    part: 7,
    first: 147,
    last: 149,
    heading: "PART 7: READING COMPREHENSION · QUESTIONS 147 - 149",
    description: "Single passage",
    passage: emailPassage,
    questions: [
      {
        number: 147,
        prompt: "What is the purpose of the email?",
        choices: [
          { key: "A", text: "To announce a new policy" },
          { key: "B", text: "To invite staff to a party" },
          { key: "C", text: "To request budget approval" },
          { key: "D", text: "To confirm a shipment" },
        ],
      },
    ],
  },
];

/** Answers shown when the room opens in the Listening scenario. */
export const demoListeningAnswers: LrAnswers = {
  ...Object.fromEntries(range(1, 31).map((number) => [number, "A"])),
  32: "B",
  33: "C",
};
export const demoListeningFlags: LrFlags = { 15: true, 36: true };

/** Answers shown when the room opens in the Reading scenario. */
export const demoReadingMissing = [
  112, 118, 126, 134, 141, 153, 161, 167, 172, 178, 181, 185, 189, 193, 197,
  198, 199, 200,
];
export const demoReadingAnswers: LrAnswers = Object.fromEntries(
  range(1, 200)
    .filter((number) => !demoReadingMissing.includes(number))
    .map((number) => [number, "A"]),
);
export const demoReadingFlags: LrFlags = { 32: true, 65: true, 112: true };

export const demoResult: LrResultReport = {
  examTitle: "Listening & Reading Exam Result - ETS 2024 Test 1",
  examIdentity: "ETS 2024 Test 01",
  takenAt: "11/06/2026",
  durationLabel: "112 minutes 45 seconds",
  scale: "ETS Standard",
  totalScore: 855,
  maxScore: 990,
  listening: { score: 445, max: 495 },
  reading: { score: 410, max: 495 },
  listeningRaw: { correct: 89, total: 100 },
  readingRaw: { correct: 83, total: 100 },
  targetScore: 800,
  parts: [
    { part: 1, correct: 6, total: 6 },
    { part: 2, correct: 23, total: 25 },
    { part: 3, correct: 34, total: 39 },
    { part: 4, correct: 26, total: 30 },
    { part: 5, correct: 27, total: 30 },
    { part: 6, correct: 13, total: 16 },
    { part: 7, correct: 43, total: 54 },
  ],
};

const wrongNumbers = [
  12, 25, 38, 47, 55, 76, 88, 112, 126, 134, 147, 153, 161, 167, 172, 178, 181,
  185,
];
const skippedNumbers = [41, 63, 79, 94, 118, 141, 144, 193, 197, 199];
export const demoReviewFlags: LrFlags = {
  15: true,
  36: true,
  112: true,
  165: true,
};

export function demoReviewStatus(number: number): LrReviewStatus {
  if (wrongNumbers.includes(number)) return "wrong";
  if (skippedNumbers.includes(number)) return "skipped";
  return "correct";
}

export const demoReviewGroups: LrReviewGroup[] = [
  {
    id: "part7-147-149",
    passage: emailPassage,
    audio: {
      currentSeconds: 24,
      totalSeconds: 58,
      note: "Practice audio · US / UK",
    },
    translation: {
      quote:
        "We are pleased to announce an update to our remote working policy.",
      body: "Starting November 1, employees may work from home up to two days a week with approval from their department manager.",
      note: "Evidence highlighted in the email · Read along with audio 00:18–00:25",
    },
    questions: [
      {
        number: 147,
        prompt: "What is the purpose of the email?",
        choices: [
          { key: "A", text: "To announce a new policy" },
          { key: "B", text: "To invite staff to a party" },
          { key: "C", text: "To request budget approval" },
          { key: "D", text: "To confirm a shipment" },
        ],
        selected: "B",
        correct: "A",
        analysis: {
          summary:
            '"Announce an update" is equivalent to "announce a new policy". The first sentence directly states the purpose of the email, so A is the correct answer.',
          trap: 'Trap B: "Dear colleagues" is only a group greeting. The email makes no mention of an invitation, party, or event.',
          notes: [
            "C: There is no request for budget approval.",
            "D: There is no mention of delivery or order confirmation.",
          ],
          skill: "Skill: Identifying text purpose",
        },
      },
    ],
  },
];
