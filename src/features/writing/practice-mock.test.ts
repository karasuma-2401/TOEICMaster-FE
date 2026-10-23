import { describe, expect, it } from "vitest";
import {
  advanceAttempt,
  advanceExpiredAttempt,
  createMockAttempt,
  remainingSeconds,
  updateAttemptAnswer,
} from "./practice-mock";

describe("Writing practice mock", () => {
  it("creates the expected 5/2/1 full attempt and a scoped Part attempt", () => {
    expect(createMockAttempt("full", "full", 1).questions).toHaveLength(8);
    const partTwo = createMockAttempt("part-2", "part-2", 1);
    expect(partTwo.questions).toHaveLength(2);
    expect(partTwo.questions.every((item) => item.question.part === 2)).toBe(
      true,
    );
  });

  it("locks a completed answer and never allows an answer while preparing", () => {
    const initial = createMockAttempt("full", "full", 1);
    expect(updateAttemptAnswer(initial, "blocked").questions[0].answer).toBe(
      "",
    );
    const answering = advanceAttempt(initial, 2);
    const answered = updateAttemptAnswer(answering, "saved answer");
    const next = advanceAttempt(answered, 3);

    expect(next.questions[0]).toMatchObject({
      answer: "saved answer",
      phase: "LOCKED",
    });
    expect(next.currentIndex).toBe(1);
    expect(next.questions[1].phase).toBe("PREPARING");
  });

  it("advances an expired phase from its persisted phase timestamp", () => {
    const attempt = createMockAttempt("part-1", "part-1", 1000);
    const expired = advanceExpiredAttempt(attempt, 31_000);

    expect(expired.questions[0].phase).toBe("ANSWERING");
    expect(remainingSeconds(expired, 31_000)).toBe(60);
  });
});
