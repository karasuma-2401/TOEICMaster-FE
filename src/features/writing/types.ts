export type WritingPart = 1 | 2 | 3;

export type WritingDifficulty = "Dễ" | "Trung bình" | "Khó";

export type WritingTestStatus = "Published" | "Draft";

export interface WritingTestPart {
  part: WritingPart;
  title: string;
  questionCount: number;
  preparationSeconds: number;
  responseSeconds: number;
}

export interface WritingTestSummary {
  id: string;
  code: string;
  title: string;
  description: string;
  difficulty: WritingDifficulty;
  status: WritingTestStatus;
  updatedAtLabel: string;
  parts: WritingTestPart[];
}

export interface WritingContentSummary {
  part: WritingPart;
  title: string;
  subtitle: string;
  exerciseCount: number;
  description: string;
}
