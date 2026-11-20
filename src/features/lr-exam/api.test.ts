import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLrAttempt,
  getLrListeningPlaylist,
  getLrMediaUrl,
  getLrPracticeDetail,
  getLrPracticeStatistics,
  getLrReview,
  LrApiError,
} from "./api";
import { reviewToState, sheetToRoomState } from "./mappers";

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";
const EXAM_ID = "22222222-2222-4222-8222-222222222222";
const BLOCK_1_ID = "33333333-3333-4333-8333-333333333333";
const BLOCK_5_ID = "44444444-4444-4444-8444-444444444444";
const ASSET_1_ID = "55555555-5555-4555-8555-555555555555";
const QUESTION_1_ID = "66666666-6666-4666-8666-666666666666";
const QUESTION_101_ID = "77777777-7777-4777-8777-777777777777";

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeSheetPayload() {
  return {
    attemptId: ATTEMPT_ID,
    examId: EXAM_ID,
    examCode: "LR-2026-01",
    examTitle: "ETS 2026 Test 01",
    versionNumber: 1,
    phase: "listening",
    startedAtUtc: "2026-11-19T00:00:00Z",
    readingStartedAtUtc: null,
    timeLimitSeconds: 7200,
    remainingSeconds: 7100,
    totalQuestions: 2,
    blocks: [
      {
        id: BLOCK_1_ID,
        part: 1,
        firstQuestionNumber: 1,
        audioAssetId: ASSET_1_ID,
        audioDurationMs: 18500,
        contextBlocks: [],
        questions: [
          {
            id: QUESTION_1_ID,
            number: 1,
            stem: null,
            optionA: "A",
            optionB: "B",
            optionC: "C",
            optionD: "D",
            imageAssetId: null,
            userSelectedKey: null,
            isFlagged: false,
          },
        ],
      },
      {
        id: BLOCK_5_ID,
        part: 5,
        firstQuestionNumber: 101,
        audioAssetId: null,
        audioDurationMs: null,
        contextBlocks: [],
        questions: [
          {
            id: QUESTION_101_ID,
            number: 101,
            stem: "Choose the best word.",
            optionA: "one",
            optionB: "two",
            optionC: "three",
            optionD: "four",
            imageAssetId: null,
            userSelectedKey: null,
            isFlagged: false,
          },
        ],
      },
    ],
  };
}

function makeReviewPayload() {
  return {
    attemptId: ATTEMPT_ID,
    examId: EXAM_ID,
    examCode: "LR-2026-01",
    examTitle: "ETS 2026 Test 01",
    totalScaledScore: 850,
    listeningScaledScore: 440,
    readingScaledScore: 410,
    isTimeExpired: false,
    counts: { correct: 1, wrong: 1, skipped: 0, flagged: 0 },
    blocks: [
      {
        id: BLOCK_1_ID,
        part: 1,
        firstQuestionNumber: 1,
        audioAssetId: ASSET_1_ID,
        audioDurationMs: 18500,
        contextBlocks: [],
        questions: [
          {
            questionId: QUESTION_1_ID,
            number: 1,
            part: 1,
            stem: null,
            optionA: "A",
            optionB: "B",
            optionC: "C",
            optionD: "D",
            userSelectedKey: "A",
            correctKey: "A",
            status: "correct",
            isFlagged: false,
            explanation: "Correct",
            translation: null,
            imageAssetId: null,
          },
        ],
      },
      {
        id: BLOCK_5_ID,
        part: 5,
        firstQuestionNumber: 101,
        audioAssetId: null,
        audioDurationMs: null,
        contextBlocks: [],
        questions: [
          {
            questionId: QUESTION_101_ID,
            number: 101,
            part: 5,
            stem: "Choose the best word.",
            optionA: "one",
            optionB: "two",
            optionC: "three",
            optionD: "four",
            userSelectedKey: "B",
            correctKey: "A",
            status: "wrong",
            isFlagged: false,
            explanation: "Wrong",
            translation: null,
            imageAssetId: null,
          },
        ],
      },
    ],
  };
}

describe("lr-exam API & mappers strict contract alignment", () => {
  it("fetches and parses the listening audio playlist", async () => {
    const payload = {
      items: [
        {
          blockId: BLOCK_1_ID,
          part: 1,
          firstQuestionNumber: 1,
          audioAssetId: ASSET_1_ID,
          durationMs: 18500,
          url: "http://minio:9000/bucket/p1.mp3?sig=1",
          expiresAtUtc: "2026-11-19T12:00:00Z",
        },
        {
          blockId: "88888888-8888-4888-8888-888888888888",
          part: 2,
          firstQuestionNumber: 7,
          audioAssetId: "99999999-9999-4999-8999-999999999999",
          durationMs: null,
          url: "http://minio:9000/bucket/p2.mp3?sig=2",
          expiresAtUtc: "2026-11-19T12:00:00Z",
        },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    const result = await getLrListeningPlaylist(ATTEMPT_ID, controller.signal);

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/lr/exam-attempts/${ATTEMPT_ID}/listening-audio-urls`,
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("rejects playlist responses missing items array", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    await expect(getLrListeningPlaylist(ATTEMPT_ID)).rejects.toBeInstanceOf(
      LrApiError,
    );
  });

  it("rejects playlist items with invalid durationMs type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          items: [
            {
              blockId: BLOCK_1_ID,
              part: 1,
              firstQuestionNumber: 1,
              audioAssetId: ASSET_1_ID,
              durationMs: "18500",
              url: "http://minio:9000/bucket/p1.mp3",
              expiresAtUtc: "2026-11-19T12:00:00Z",
            },
          ],
        }),
      ),
    );
    await expect(getLrListeningPlaylist(ATTEMPT_ID)).rejects.toBeInstanceOf(
      LrApiError,
    );
  });

  it("parses LrSheetApi without masterAudioObjectKey and preserves audioDurationMs", async () => {
    const payload = makeSheetPayload();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));

    const sheet = await getLrAttempt(ATTEMPT_ID);

    expect(sheet.blocks[0]?.audioDurationMs).toBe(18500);
    expect(sheet.blocks[1]?.audioDurationMs).toBeNull();
    expect("masterAudioObjectKey" in sheet).toBe(false);

    const roomState = sheetToRoomState(sheet);
    expect("masterAudioObjectKey" in roomState).toBe(false);
    expect(roomState.groups[0]?.audio).toEqual({
      assetId: ASSET_1_ID,
      durationMs: 18500,
    });
    expect(roomState.groups[1]?.audio).toBeUndefined();
  });

  it("parses LrReviewApi audioAssetId and audioDurationMs and maps onto LrReviewGroup", async () => {
    const payload = makeReviewPayload();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));

    const review = await getLrReview(ATTEMPT_ID, "All");

    expect(review.blocks[0]?.audioAssetId).toBe(ASSET_1_ID);
    expect(review.blocks[0]?.audioDurationMs).toBe(18500);
    expect(review.blocks[1]?.audioAssetId).toBeNull();
    expect(review.blocks[1]?.audioDurationMs).toBeNull();

    const state = reviewToState(review);
    expect(state.groups[0]?.audio).toEqual({
      assetId: ASSET_1_ID,
      durationMs: 18500,
    });
    expect(state.groups[1]?.audio).toBeUndefined();
  });

  it("rejects review blocks with non-string audioAssetId", async () => {
    const payload = makeReviewPayload();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          ...payload,
          blocks: [
            {
              ...payload.blocks[0],
              audioAssetId: 12345,
            },
          ],
        }),
      ),
    );

    await expect(getLrReview(ATTEMPT_ID)).rejects.toBeInstanceOf(LrApiError);
  });

  it("requires a non-empty assetId on getLrMediaUrl", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        url: "http://minio:9000/bucket/p1.mp3?sig=1",
        expiresAtUtc: "2026-11-19T12:00:00Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const ok = await getLrMediaUrl(ATTEMPT_ID, "audio", ASSET_1_ID);
    expect(ok.url).toBe("http://minio:9000/bucket/p1.mp3?sig=1");
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/lr/exam-attempts/${ATTEMPT_ID}/audio/${ASSET_1_ID}`,
      expect.any(Object),
    );

    fetchMock.mockClear();
    await expect(getLrMediaUrl(ATTEMPT_ID, "audio", "")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates part and boundary response in getLrPracticeStatistics", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLrPracticeStatistics(0)).rejects.toMatchObject({
      name: "LrApiError",
      status: 400,
    });
    await expect(getLrPracticeStatistics(8)).rejects.toMatchObject({
      name: "LrApiError",
      status: 400,
    });
    await expect(getLrPracticeStatistics(1.5)).rejects.toMatchObject({
      name: "LrApiError",
      status: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(
      Response.json([{ itemId: ASSET_1_ID, attemptCount: "bad" }]),
    );
    await expect(getLrPracticeStatistics(1)).rejects.toMatchObject({
      name: "LrApiError",
      status: 502,
    });

    const stats = [
      {
        itemId: ASSET_1_ID,
        attemptCount: 2,
        bestScore: 5,
        totalQuestions: 6,
      },
    ];
    fetchMock.mockResolvedValueOnce(Response.json(stats));
    await expect(getLrPracticeStatistics(1)).resolves.toEqual(stats);
  });

  it("parses getLrPracticeDetail when difficulty is null", async () => {
    const payload = {
      id: ASSET_1_ID,
      part: 5,
      kind: "single",
      code: "P5-001",
      topic: "Grammar",
      difficulty: null,
      context: null,
      audioUrl: null,
      imageUrl: null,
      questions: [
        {
          id: QUESTION_1_ID,
          ordinal: 1,
          code: null,
          prompt: "Choose the correct option.",
          optionA: "A",
          optionB: "B",
          optionC: "C",
          optionD: "D",
        },
      ],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));

    const detail = await getLrPracticeDetail(ASSET_1_ID);
    expect(detail.difficulty).toBeNull();
    expect(detail.questions).toHaveLength(1);
  });
});
