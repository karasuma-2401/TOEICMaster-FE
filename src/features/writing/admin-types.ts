import type { WritingDifficulty, WritingPart } from "./types";

export type WritingQuestionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AdminWritingTestStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface WritingQuestionBase {
  id: string;
  version?: number;
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
  imageAssetId?: string;
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
  version?: number;
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

export function createQuestionId(part: WritingPart) {
  return `wp${part}-${Date.now()}`;
}
