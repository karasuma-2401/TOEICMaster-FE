export type LrSection = "listening" | "reading";
export type LrPartId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type LrChoiceKey = "A" | "B" | "C" | "D";

export interface LrPartSpec {
  id: LrPartId;
  section: LrSection;
  first: number;
  last: number;
  /** Title used in the question palette, e.g. "Short Conversations". */
  title: string;
  /** Title used in the score report, e.g. "Conversations". */
  reportTitle: string;
}

export interface LrChoice {
  key: LrChoiceKey;
  text: string;
}

export interface LrQuestion {
  number: number;
  prompt: string;
  choices: LrChoice[];
  imageUrl?: string;
}

export interface LrPassage {
  label: string;
  title: string;
  meta?: string;
  /** Paragraphs in order. `evidence: true` marks the highlighted sentence. */
  paragraphs: { text: string; evidence?: boolean; imageUrl?: string }[];
  signature?: string[];
}

export interface LrQuestionGroup {
  id: string;
  part: LrPartId;
  /** First and last question number covered by the group (inclusive). */
  first: number;
  last: number;
  heading: string;
  description?: string;
  passage?: LrPassage;
  audio?: { src?: string; currentSeconds?: number; totalSeconds?: number };
  questions: LrQuestion[];
}

export interface LrExamSummary {
  id: string;
  title: string;
  /** Short identity shown in the exam header, e.g. "ETS 2024 · Test 01". */
  identity: string;
  breadcrumb: string;
  totalQuestions: number;
  durationMinutes: number;
  scoreScale: string;
}

export type LrAnswers = Record<number, LrChoiceKey>;
export type LrFlags = Record<number, true>;

export type LrReviewStatus = "correct" | "wrong" | "skipped";

export interface LrReviewQuestionDetail extends LrQuestion {
  selected?: LrChoiceKey;
  correct: LrChoiceKey;
  analysis: {
    summary: string;
    trap?: string;
    notes?: string[];
    skill: string;
  };
}

export interface LrReviewGroup {
  id: string;
  passage?: LrPassage;
  audio?: { currentSeconds: number; totalSeconds: number; note: string };
  translation?: { quote: string; body: string; note: string };
  questions: LrReviewQuestionDetail[];
}

export interface LrPartResult {
  part: LrPartId;
  correct: number;
  total: number;
}

export interface LrResultReport {
  examTitle: string;
  examIdentity: string;
  takenAt: string;
  durationLabel: string;
  scale: string;
  totalScore: number;
  maxScore: number;
  listening: { score: number; max: number };
  reading: { score: number; max: number };
  targetScore?: number;
  parts: LrPartResult[];
}
