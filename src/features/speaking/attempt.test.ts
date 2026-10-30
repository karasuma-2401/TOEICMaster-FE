import { describe, expect, it } from "vitest";
import { currentQuestion, parseAttempt, phaseSecondsLeft } from "./attempt";
import { attemptDto } from "./testing/fixtures";

describe("Speaking attempt", () => {
  it("parses unrevealed questions as null and finds the current one", () => {
    const attempt = parseAttempt(attemptDto());
    const question = currentQuestion(attempt);

    expect(question?.position).toBe(1);
    expect(question?.content).toMatchObject({
      part: 4,
      questions: [null, null, null],
    });
  });

  it("rejects content whose Part does not match the question", () => {
    const dto = attemptDto();
    dto.questions[0].part = 3;
    expect(() => parseAttempt(dto)).toThrow(
      expect.objectContaining({ status: 502 }),
    );
  });

  it("counts down against the server clock", () => {
    const attempt = parseAttempt(attemptDto());
    const clientNow = Date.parse("2026-10-23T10:00:10Z");

    expect(phaseSecondsLeft(attempt, clientNow, 0)).toBe(35);
    // Client clock 5s behind the server.
    expect(phaseSecondsLeft(attempt, clientNow, 5_000)).toBe(30);
    expect(phaseSecondsLeft(attempt, clientNow + 60_000, 0)).toBe(0);
  });
});
