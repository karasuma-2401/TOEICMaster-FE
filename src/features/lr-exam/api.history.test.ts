import { afterEach, describe, expect, it, vi } from "vitest";
import { getLrAttemptHistory, LrApiError } from "./api";

const ATTEMPT_1_ID = "11111111-1111-4111-8111-111111111111";
const ATTEMPT_2_ID = "22222222-2222-4222-8222-222222222222";
const ATTEMPT_3_ID = "33333333-3333-4333-8333-333333333333";
const EXAM_ID = "44444444-4444-4444-8444-444444444444";

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeHistoryItem(overrides: Record<string, unknown> = {}) {
  return {
    attemptId: ATTEMPT_1_ID,
    examId: EXAM_ID,
    examTitle: "ETS 2026 Test 01",
    examCode: "LR-2026-01",
    status: 2,
    listeningScaledScore: 440,
    readingScaledScore: 410,
    totalScaledScore: 850,
    isTimeExpired: false,
    startedAtUtc: "2026-11-18T08:00:00Z",
    submittedAtUtc: "2026-11-18T10:00:00Z",
    durationSeconds: 7200,
    ...overrides,
  };
}

function makePagedHistory(
  items: unknown[] = [makeHistoryItem()],
  overrides: Record<string, unknown> = {},
) {
  return {
    items,
    totalCount: items.length,
    pageIndex: 1,
    pageSize: 10,
    ...overrides,
  };
}

describe("getLrAttemptHistory", () => {
  it("normalizes numeric statuses 1, 2, 3 and forwards query params and signal", async () => {
    const payload = makePagedHistory([
      makeHistoryItem({
        attemptId: ATTEMPT_1_ID,
        status: 1,
        listeningScaledScore: null,
        readingScaledScore: null,
        totalScaledScore: null,
        submittedAtUtc: null,
        durationSeconds: null,
      }),
      makeHistoryItem({
        attemptId: ATTEMPT_2_ID,
        status: 2,
      }),
      makeHistoryItem({
        attemptId: ATTEMPT_3_ID,
        status: 3,
        listeningScaledScore: null,
        readingScaledScore: null,
        totalScaledScore: null,
        submittedAtUtc: null,
        durationSeconds: 300,
      }),
    ]);

    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    const result = await getLrAttemptHistory(
      { pageIndex: 2, pageSize: 20, examId: EXAM_ID },
      controller.signal,
    );

    expect(result.items.map((item) => item.status)).toEqual([
      "InProgress",
      "Completed",
      "Abandoned",
    ]);
    expect(result.totalCount).toBe(3);

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const parsedUrl = new URL(calledUrl, "http://localhost");
    expect(parsedUrl.pathname).toBe("/api/lr/exam-attempts/history");
    expect(parsedUrl.searchParams.get("pageIndex")).toBe("2");
    expect(parsedUrl.searchParams.get("pageSize")).toBe("20");
    expect(parsedUrl.searchParams.get("examId")).toBe(EXAM_ID);
    expect(calledInit.signal).toBe(controller.signal);
  });

  it("preserves string enum statuses InProgress, Completed, and Abandoned", async () => {
    const payload = makePagedHistory([
      makeHistoryItem({ attemptId: ATTEMPT_1_ID, status: "InProgress" }),
      makeHistoryItem({ attemptId: ATTEMPT_2_ID, status: "Completed" }),
      makeHistoryItem({ attemptId: ATTEMPT_3_ID, status: "Abandoned" }),
    ]);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));

    const result = await getLrAttemptHistory();

    expect(result.items.map((item) => item.status)).toEqual([
      "InProgress",
      "Completed",
      "Abandoned",
    ]);
  });

  it("propagates 401 responses as LrApiError with status 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ title: "Unauthorized" }, { status: 401 }),
        ),
    );

    await expect(getLrAttemptHistory()).rejects.toMatchObject({
      name: "LrApiError",
      status: 401,
    });
  });

  it("rejects payloads with non-array items as LrApiError(502)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(Response.json(makePagedHistory([], { items: {} }))),
    );

    await expect(getLrAttemptHistory()).rejects.toSatisfy(
      (error) => error instanceof LrApiError && error.status === 502,
    );
  });

  it("rejects items with unknown numeric status as LrApiError(502)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(makePagedHistory([makeHistoryItem({ status: 99 })])),
        ),
    );

    await expect(getLrAttemptHistory()).rejects.toSatisfy(
      (error) => error instanceof LrApiError && error.status === 502,
    );
  });

  it("rejects items with unknown string status as LrApiError(502)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            makePagedHistory([makeHistoryItem({ status: "Cancelled" })]),
          ),
        ),
    );

    await expect(getLrAttemptHistory()).rejects.toSatisfy(
      (error) => error instanceof LrApiError && error.status === 502,
    );
  });

  it("rejects items with non-string attemptId as LrApiError(502)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            makePagedHistory([makeHistoryItem({ attemptId: 123 })]),
          ),
        ),
    );

    await expect(getLrAttemptHistory()).rejects.toSatisfy(
      (error) => error instanceof LrApiError && error.status === 502,
    );
  });

  it("rejects items with non-numeric totalScaledScore as LrApiError(502)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            makePagedHistory([makeHistoryItem({ totalScaledScore: "850" })]),
          ),
        ),
    );

    await expect(getLrAttemptHistory()).rejects.toSatisfy(
      (error) => error instanceof LrApiError && error.status === 502,
    );
  });

  it("rejects payloads with non-numeric totalCount as LrApiError(502)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            makePagedHistory([makeHistoryItem()], { totalCount: "1" }),
          ),
        ),
    );

    await expect(getLrAttemptHistory()).rejects.toSatisfy(
      (error) => error instanceof LrApiError && error.status === 502,
    );
  });
});
