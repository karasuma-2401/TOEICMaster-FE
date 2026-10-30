import { describe, expect, it } from "vitest";
import { parseAttempt } from "./attempt";
import { isEvaluationPending, parseEvaluation } from "./evaluation";
import { attemptDto, evaluationDto } from "./testing/fixtures";

describe("Speaking AI evaluation", () => {
  it("parses a completed report with Azure and language-model scores", () => {
    const evaluation = parseEvaluation(evaluationDto());

    expect(evaluation).toMatchObject({
      status: "COMPLETED",
      estimatedScore: 130,
    });
    expect(evaluation?.items[0]).toMatchObject({
      recognitionStatus: "RECOGNIZED",
      pronunciationScore: 79.2,
      grammarScore: 80,
      rawScore: 2,
      wordIssues: [{ word: "conference", accuracyScore: 41 }],
    });
    expect(evaluation?.items[2]).toMatchObject({
      recognitionStatus: "NO_SPEECH",
      grammarScore: null,
      suggestedResponse: null,
    });
  });

  it("treats a missing evaluation as not requested and follows pending states", () => {
    expect(parseAttempt(attemptDto()).evaluation).toBeNull();
    expect(
      parseAttempt(attemptDto({ evaluation: null })).evaluation,
    ).toBeNull();
    const queued = parseEvaluation(
      evaluationDto({ status: "QUEUED", items: [] }),
    );
    expect(isEvaluationPending(queued)).toBe(true);
    expect(isEvaluationPending(parseEvaluation(evaluationDto()))).toBe(false);
  });

  it("rejects scores outside the contract", () => {
    const tooHigh = evaluationDto();
    tooHigh.items[0].rawScore = 4;
    expect(() => parseEvaluation(tooHigh)).toThrow(
      expect.objectContaining({ status: 502 }),
    );
    expect(() =>
      parseEvaluation(evaluationDto({ estimatedScore: 210 })),
    ).toThrow(expect.objectContaining({ status: 502 }));
    expect(() => parseEvaluation(evaluationDto({ status: "DONE" }))).toThrow(
      expect.objectContaining({ status: 502 }),
    );
  });
});
