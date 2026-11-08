// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type {
  WritingAttemptQuestionApi,
  WritingEvaluationApi,
} from "@/features/writing/attempt-api";
import { WritingEvaluationReport } from "./writing-evaluation-report";

afterEach(cleanup);

it("shows part totals only when every question in that part has feedback", () => {
  const questions = [
    { position: 1, part: 1, answer: "" },
    { position: 2, part: 1, answer: "" },
    { position: 3, part: 2, answer: "" },
  ] as WritingAttemptQuestionApi[];
  const evaluation: WritingEvaluationApi = {
    status: "COMPLETED",
    provider: "Gemini",
    model: "test",
    rubricVersion: "test",
    consentAcceptedAtUtc: null,
    queuedAtUtc: null,
    completedAtUtc: null,
    retryCount: 0,
    failureMessage: null,
    estimatedScore: 100,
    summary: "Summary",
    strengths: [],
    improvements: [],
    feedback: [
      {
        questionPosition: 1,
        criterionScore: 2,
        feedback: "A",
        suggestedRevision: "A",
      },
      {
        questionPosition: 2,
        criterionScore: 3,
        feedback: "B",
        suggestedRevision: "B",
      },
    ],
  };

  render(
    <WritingEvaluationReport evaluation={evaluation} questions={questions} />,
  );

  expect(screen.getByText("2 câu · Writing Part 1")).toBeInTheDocument();
  expect(screen.getByText("/ 6")).toBeInTheDocument();
  expect(screen.queryByText("1 câu · Writing Part 2")).not.toBeInTheDocument();
});
