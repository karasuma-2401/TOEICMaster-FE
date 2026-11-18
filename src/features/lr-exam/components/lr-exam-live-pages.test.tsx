// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/lr-exam/api", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/lr-exam/api")>();
  return {
    ...original,
    getLrAttempt: vi.fn(),
    getLrListeningPlaylist: vi.fn(),
    getLrMediaUrl: vi.fn(),
    getLrReview: vi.fn(),
  };
});

import {
  getLrAttempt,
  getLrListeningPlaylist,
  getLrMediaUrl,
  getLrReview,
  type LrSheetApi,
} from "@/features/lr-exam/api";
import { LrExamSessionPage, LrReviewPage } from "./lr-exam-live-pages";

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";
const EXAM_ID = "22222222-2222-4222-8222-222222222222";
const AUDIO_1 = "33333333-3333-4333-8333-333333333333";
const AUDIO_2 = "44444444-4444-4444-8444-444444444444";
const IMAGE_1 = "55555555-5555-4555-8555-555555555555";

function makeSheet(phase: "listening" | "reading"): LrSheetApi {
  return {
    attemptId: ATTEMPT_ID,
    examId: EXAM_ID,
    examCode: "LR-2026-01",
    examTitle: "ETS 2026 Test 01",
    versionNumber: 1,
    phase,
    startedAtUtc: "2026-11-19T00:00:00Z",
    readingStartedAtUtc: phase === "reading" ? "2026-11-19T00:45:00Z" : null,
    timeLimitSeconds: 7200,
    remainingSeconds: 6000,
    totalQuestions: 2,
    blocks: [
      {
        id: "b1",
        part: 1,
        firstQuestionNumber: 1,
        audioAssetId: AUDIO_1,
        audioDurationMs: 15_000,
        contextBlocks: [],
        questions: [
          {
            id: "q1",
            number: 1,
            stem: null,
            optionA: "A",
            optionB: "B",
            optionC: "C",
            optionD: "D",
            imageAssetId: IMAGE_1,
            userSelectedKey: null,
            isFlagged: false,
          },
        ],
      },
      {
        id: "b2",
        part: 2,
        firstQuestionNumber: 7,
        audioAssetId: AUDIO_2,
        audioDurationMs: 12_000,
        contextBlocks: [],
        questions: [
          {
            id: "q7",
            number: 7,
            stem: null,
            optionA: "A",
            optionB: "B",
            optionC: "C",
            optionD: null,
            imageAssetId: null,
            userSelectedKey: null,
            isFlagged: false,
          },
        ],
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => "blob:mock"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(new Blob(["mp3"]), { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("LrExamSessionPage & LrReviewPage entrypoints", () => {
  it("fetches listening playlist once when phase is listening without firing per-asset audio requests", async () => {
    vi.mocked(getLrAttempt).mockResolvedValueOnce(makeSheet("listening"));
    vi.mocked(getLrListeningPlaylist).mockResolvedValueOnce({
      items: [
        {
          blockId: "b1",
          part: 1,
          firstQuestionNumber: 1,
          audioAssetId: AUDIO_1,
          durationMs: 15_000,
          url: "https://minio.example.test/1.mp3",
          expiresAtUtc: "2026-11-19T12:00:00Z",
        },
        {
          blockId: "b2",
          part: 2,
          firstQuestionNumber: 7,
          audioAssetId: AUDIO_2,
          durationMs: 12_000,
          url: "https://minio.example.test/2.mp3",
          expiresAtUtc: "2026-11-19T12:00:00Z",
        },
      ],
    });
    vi.mocked(getLrMediaUrl).mockResolvedValue({
      url: "https://minio.example.test/q1.png",
      expiresAtUtc: "2026-11-19T12:00:00Z",
    });

    render(<LrExamSessionPage attemptId={ATTEMPT_ID} />);

    expect(
      await screen.findByTestId("lr-master-audio-player"),
    ).toBeInTheDocument();
    expect(getLrListeningPlaylist).toHaveBeenCalledTimes(1);
    expect(getLrListeningPlaylist).toHaveBeenCalledWith(
      ATTEMPT_ID,
      expect.any(AbortSignal),
    );
    expect(getLrMediaUrl).not.toHaveBeenCalledWith(
      ATTEMPT_ID,
      "audio",
      expect.anything(),
      expect.anything(),
    );
  });

  it("does not call getLrListeningPlaylist when phase is reading", async () => {
    vi.mocked(getLrAttempt).mockResolvedValueOnce(makeSheet("reading"));
    vi.mocked(getLrMediaUrl).mockResolvedValue({
      url: "https://minio.example.test/q1.png",
      expiresAtUtc: "2026-11-19T12:00:00Z",
    });

    render(<LrExamSessionPage attemptId={ATTEMPT_ID} />);

    await waitFor(() => expect(getLrAttempt).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.queryByTestId("lr-master-audio-player")).toBeNull(),
    );
    expect(getLrListeningPlaylist).not.toHaveBeenCalled();
  });

  it("does not eagerly fetch audio URLs on LrReviewPage mount and passes attemptId to LrReview", async () => {
    vi.mocked(getLrReview).mockResolvedValueOnce({
      attemptId: ATTEMPT_ID,
      examId: EXAM_ID,
      examCode: "LR-2026-01",
      examTitle: "ETS 2026 Test 01",
      totalScaledScore: 800,
      listeningScaledScore: 400,
      readingScaledScore: 400,
      isTimeExpired: false,
      counts: { correct: 1, wrong: 0, skipped: 0, flagged: 0 },
      blocks: [
        {
          id: "b1",
          part: 1,
          firstQuestionNumber: 1,
          audioAssetId: AUDIO_1,
          audioDurationMs: 18_000,
          contextBlocks: [],
          questions: [
            {
              questionId: "q1",
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
              explanation: "Explanation",
              translation: null,
              imageAssetId: IMAGE_1,
            },
          ],
        },
      ],
    });
    vi.mocked(getLrMediaUrl).mockResolvedValue({
      url: "https://minio.example.test/q1.png",
      expiresAtUtc: "2026-11-19T12:00:00Z",
    });

    render(<LrReviewPage attemptId={ATTEMPT_ID} />);

    expect(
      await screen.findByTestId("lr-review-audio-player"),
    ).toBeInTheDocument();
    expect(getLrMediaUrl).not.toHaveBeenCalledWith(
      ATTEMPT_ID,
      "audio",
      expect.anything(),
      expect.anything(),
    );
  });
});
