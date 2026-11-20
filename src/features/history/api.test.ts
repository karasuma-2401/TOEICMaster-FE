import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchUnifiedHistory } from "./api";

vi.mock("@/features/auth/api", () => ({ refreshSession: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

const LR_EXAM_ID = "11111111-1111-4111-8111-111111111111";
const LR_COMPLETED_ID = "11111111-1111-4111-8111-111111111112";
const LR_PROGRESS_ID = "11111111-1111-4111-8111-111111111113";
const SPK_TEST_ID = "22222222-2222-4222-8222-222222222221";
const SPK_SUBMITTED_ID = "22222222-2222-4222-8222-222222222222";
const SPK_PROGRESS_ID = "22222222-2222-4222-8222-222222222223";
const WRT_TEST_ID = "33333333-3333-4333-8333-333333333331";
const WRT_SUBMITTED_ID = "33333333-3333-4333-8333-333333333332";
const WRT_PROGRESS_ID = "33333333-3333-4333-8333-333333333333";

function lrHistoryResponse() {
  return Response.json({
    items: [
      {
        attemptId: LR_COMPLETED_ID,
        examId: LR_EXAM_ID,
        examTitle: "ETS 2026 L&R Test 01",
        examCode: "LR-01",
        status: 2,
        listeningScaledScore: 445,
        readingScaledScore: 420,
        totalScaledScore: 865,
        isTimeExpired: false,
        startedAtUtc: "2026-11-18T08:00:00Z",
        submittedAtUtc: "2026-11-18T10:00:00Z",
        durationSeconds: 7200,
      },
      {
        attemptId: LR_PROGRESS_ID,
        examId: LR_EXAM_ID,
        examTitle: "ETS 2026 L&R Test 01",
        examCode: "LR-01",
        status: 1,
        listeningScaledScore: null,
        readingScaledScore: null,
        totalScaledScore: null,
        isTimeExpired: false,
        startedAtUtc: "2026-11-19T09:00:00Z",
        submittedAtUtc: null,
        durationSeconds: null,
      },
    ],
    totalCount: 2,
    pageIndex: 1,
    pageSize: 50,
  });
}

function speakingHistoryResponse() {
  return Response.json({
    items: [
      {
        id: SPK_SUBMITTED_ID,
        testId: SPK_TEST_ID,
        exerciseId: null,
        testCode: "SPK-01",
        testTitle: "Speaking Test 01",
        mode: "FULL",
        status: "SUBMITTED",
        questionCount: 11,
        recordedCount: 11,
        createdAtUtc: "2026-11-19T07:00:00Z",
        updatedAtUtc: "2026-11-19T07:20:00Z",
        submittedAtUtc: "2026-11-19T07:20:00Z",
        evaluationStatus: "COMPLETED",
        estimatedScore: 160,
      },
      {
        id: SPK_PROGRESS_ID,
        testId: SPK_TEST_ID,
        exerciseId: null,
        testCode: "SPK-02",
        testTitle: "Speaking Test 02",
        mode: "PART_4",
        status: "IN_PROGRESS",
        questionCount: 3,
        recordedCount: 1,
        createdAtUtc: "2026-11-17T06:00:00Z",
        updatedAtUtc: "2026-11-17T06:05:00Z",
        submittedAtUtc: null,
        evaluationStatus: null,
        estimatedScore: null,
      },
    ],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 2,
    totalPages: 1,
  });
}

function writingHistoryResponse() {
  return Response.json({
    items: [
      {
        id: WRT_SUBMITTED_ID,
        testId: WRT_TEST_ID,
        testCode: "WRT-01",
        testTitle: "Writing Test 01",
        mode: "FULL",
        status: "SUBMITTED_AWAITING_EVALUATION",
        questionCount: 8,
        currentQuestionPosition: null,
        createdAtUtc: "2026-11-19T08:00:00Z",
        submittedAtUtc: "2026-11-19T08:50:00Z",
        updatedAtUtc: "2026-11-19T08:50:00Z",
        evaluationStatus: "COMPLETED",
        estimatedScore: 170,
        isPractice: false,
      },
      {
        id: WRT_PROGRESS_ID,
        testId: WRT_TEST_ID,
        testCode: "WRT-02",
        testTitle: "Writing Test 02",
        mode: "PART_2",
        status: "IN_PROGRESS",
        questionCount: 2,
        currentQuestionPosition: 1,
        createdAtUtc: "2026-11-18T12:00:00Z",
        submittedAtUtc: null,
        updatedAtUtc: "2026-11-18T12:05:00Z",
        evaluationStatus: null,
        estimatedScore: null,
        isPractice: false,
      },
    ],
  });
}

describe("fetchUnifiedHistory", () => {
  it("merges L&R, Speaking, and Writing attempts sorted newest-first with skill-specific hrefs", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/lr/exam-attempts/history")) {
        return Promise.resolve(lrHistoryResponse());
      }
      if (url.startsWith("/api/speaking/attempts")) {
        return Promise.resolve(speakingHistoryResponse());
      }
      if (url.startsWith("/api/writing/attempts")) {
        return Promise.resolve(writingHistoryResponse());
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { items, unauthenticatedSkills } = await fetchUnifiedHistory();

    expect(unauthenticatedSkills).toEqual([]);
    expect(items.map((item) => item.id)).toEqual([
      LR_PROGRESS_ID, // 2026-11-19T09:00:00Z
      WRT_SUBMITTED_ID, // 2026-11-19T08:50:00Z
      SPK_SUBMITTED_ID, // 2026-11-19T07:20:00Z
      WRT_PROGRESS_ID, // 2026-11-18T12:00:00Z
      LR_COMPLETED_ID, // 2026-11-18T10:00:00Z
      SPK_PROGRESS_ID, // 2026-11-17T06:00:00Z
    ]);

    const lrCompleted = items.find((i) => i.id === LR_COMPLETED_ID);
    expect(lrCompleted).toMatchObject({
      skill: "lr",
      status: "COMPLETED",
      score: 865,
      maxScore: 990,
      resultHref: `/exams/lr/attempts/${LR_COMPLETED_ID}/result`,
      reviewHref: `/exams/lr/attempts/${LR_COMPLETED_ID}/review`,
      resumeHref: null,
    });

    const lrProgress = items.find((i) => i.id === LR_PROGRESS_ID);
    expect(lrProgress).toMatchObject({
      skill: "lr",
      status: "IN_PROGRESS",
      score: null,
      maxScore: 990,
      resultHref: null,
      reviewHref: null,
      resumeHref: `/exams/lr/attempts/${LR_PROGRESS_ID}/attempt`,
    });

    const spkCompleted = items.find((i) => i.id === SPK_SUBMITTED_ID);
    expect(spkCompleted).toMatchObject({
      skill: "speaking",
      status: "COMPLETED",
      score: 160,
      maxScore: 200,
      resultHref: `/speaking/attempts/${SPK_SUBMITTED_ID}`,
      reviewHref: `/speaking/attempts/${SPK_SUBMITTED_ID}/review/1`,
      resumeHref: null,
    });

    const spkProgress = items.find((i) => i.id === SPK_PROGRESS_ID);
    expect(spkProgress).toMatchObject({
      skill: "speaking",
      status: "IN_PROGRESS",
      resultHref: null,
      reviewHref: null,
      resumeHref: `/speaking/attempts/${SPK_PROGRESS_ID}`,
    });

    const wrtCompleted = items.find((i) => i.id === WRT_SUBMITTED_ID);
    expect(wrtCompleted).toMatchObject({
      skill: "writing",
      status: "COMPLETED",
      score: 170,
      maxScore: 200,
      resultHref: `/writing/attempts/${WRT_SUBMITTED_ID}/result`,
      reviewHref: `/writing/attempts/${WRT_SUBMITTED_ID}/review`,
      resumeHref: null,
    });

    const wrtProgress = items.find((i) => i.id === WRT_PROGRESS_ID);
    expect(wrtProgress).toMatchObject({
      skill: "writing",
      status: "IN_PROGRESS",
      resultHref: null,
      reviewHref: null,
      resumeHref: `/writing/attempts/${WRT_PROGRESS_ID}`,
    });
  });

  it("fetches only requested skills when skills filter is provided", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/lr/exam-attempts/history")) {
        return Promise.resolve(lrHistoryResponse());
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { items } = await fetchUnifiedHistory({ skills: ["lr"] });

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.skill === "lr")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/api/lr/exam-attempts/history",
    );
  });

  it("handles 401 for an unauthenticated skill without discarding other skills", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/lr/exam-attempts/history")) {
        return Promise.resolve(
          Response.json({ title: "Unauthorized" }, { status: 401 }),
        );
      }
      if (url.startsWith("/api/speaking/attempts")) {
        return Promise.resolve(speakingHistoryResponse());
      }
      if (url.startsWith("/api/writing/attempts")) {
        return Promise.resolve(
          Response.json({ title: "Unauthorized" }, { status: 401 }),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { items, unauthenticatedSkills } = await fetchUnifiedHistory();

    expect(unauthenticatedSkills).toEqual(
      expect.arrayContaining(["lr", "writing"]),
    );
    expect(unauthenticatedSkills).not.toContain("speaking");
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.skill === "speaking")).toBe(true);
  });
});
