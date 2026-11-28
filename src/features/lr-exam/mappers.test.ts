import { describe, expect, it } from "vitest";
import type { LrReviewApi } from "./api";
import { reviewToState } from "./mappers";

describe("reviewToState", () => {
  it("keeps historical review available when an exam question has no answer key", () => {
    const review: LrReviewApi = {
      attemptId: "attempt",
      examId: "exam",
      examCode: "SAMPLE",
      examTitle: "Sample",
      totalScaledScore: 10,
      listeningScaledScore: 5,
      readingScaledScore: 5,
      isTimeExpired: false,
      counts: { correct: 0, wrong: 0, skipped: 1, flagged: 0 },
      blocks: [
        {
          id: "block",
          part: 1,
          firstQuestionNumber: 3,
          audioAssetId: null,
          audioDurationMs: null,
          contextBlocks: [],
          questions: [
            {
              questionId: "question",
              number: 3,
              part: 1,
              stem: "What is shown?",
              optionA: "A",
              optionB: "B",
              optionC: "C",
              optionD: "D",
              userSelectedKey: null,
              correctKey: null,
              status: "skipped",
              isFlagged: false,
              explanation: null,
              translation: null,
              imageAssetId: null,
            },
          ],
        },
      ],
    };

    const state = reviewToState(review);
    expect(state.groups[0]?.questions[0]?.correct).toBeUndefined();
    expect(state.groups[0]?.questions[0]?.analysis.summary).toContain(
      "no answer key",
    );
  });
});
