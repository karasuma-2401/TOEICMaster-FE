import { describe, expect, it } from "vitest";
import {
  createAdminTestDraft,
  getAdminQuestions,
  validateTestForPublish,
} from "./admin-mock";

describe("Writing admin mock repository", () => {
  it("creates a full draft with the Writing 5/2/1 structure", () => {
    const draft = createAdminTestDraft();

    expect(draft.questionIds[1]).toHaveLength(5);
    expect(draft.questionIds[2]).toHaveLength(2);
    expect(draft.questionIds[3]).toHaveLength(1);
    expect(validateTestForPublish(draft)).toEqual([]);
  });

  it("blocks publishing when the builder has a missing or unpublished slot", () => {
    const draft = createAdminTestDraft();
    const unavailable = getAdminQuestions().find(
      (question) => question.part === 1 && question.status !== "PUBLISHED",
    );

    expect(unavailable).toBeDefined();
    draft.questionIds[1] = [unavailable?.id ?? "missing"];

    expect(validateTestForPublish(draft)).toEqual(
      expect.arrayContaining([
        "Part 1 phải có đúng 5 câu.",
        "Part 1 có câu hỏi không hợp lệ hoặc chưa công bố.",
      ]),
    );
  });
});
