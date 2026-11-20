import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpeakingAttempts } from "./api";
import { ids } from "./testing/fixtures";

vi.mock("@/features/auth/api", () => ({ refreshSession: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

describe("getSpeakingAttempts summary alignment", () => {
  it("preserves testCode, testTitle, questionCount, submittedAtUtc, and evaluationStatus from backend DTO", async () => {
    const payload = {
      items: [
        {
          id: ids.attempt,
          testId: ids.test,
          exerciseId: null,
          testCode: "SPK-2026-01",
          testTitle: "TOEIC Speaking Practice Test 01",
          mode: "FULL",
          status: "SUBMITTED",
          questionCount: 11,
          recordedCount: 11,
          createdAtUtc: "2026-11-18T08:00:00Z",
          updatedAtUtc: "2026-11-18T08:25:00Z",
          submittedAtUtc: "2026-11-18T08:25:00Z",
          evaluationStatus: "COMPLETED",
          estimatedScore: 155,
        },
      ],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
    };

    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    const attempts = await getSpeakingAttempts();

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/speaking/attempts");
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      id: ids.attempt,
      testId: ids.test,
      exerciseId: null,
      testCode: "SPK-2026-01",
      testTitle: "TOEIC Speaking Practice Test 01",
      mode: "FULL",
      status: "SUBMITTED",
      questionCount: 11,
      recordedCount: 11,
      createdAtUtc: "2026-11-18T08:00:00Z",
      updatedAtUtc: "2026-11-18T08:25:00Z",
      submittedAtUtc: "2026-11-18T08:25:00Z",
      evaluationStatus: "COMPLETED",
      estimatedScore: 155,
    });
  });

  it("provides safe null or default fallbacks when optional summary fields are omitted", async () => {
    const legacyPayload = {
      items: [
        {
          id: ids.attempt,
          testId: ids.test,
          exerciseId: null,
          mode: "PART_2",
          status: "IN_PROGRESS",
          recordedCount: 1,
          createdAtUtc: "2026-11-18T08:00:00Z",
          updatedAtUtc: "2026-11-18T08:05:00Z",
          estimatedScore: null,
        },
      ],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json(legacyPayload)),
    );

    const attempts = await getSpeakingAttempts();

    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      id: ids.attempt,
      testCode: "",
      testTitle: "",
      questionCount: 0,
      submittedAtUtc: null,
      evaluationStatus: null,
      estimatedScore: null,
    });
  });
});
