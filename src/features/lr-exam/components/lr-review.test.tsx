// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    getLrMediaUrl: vi.fn(),
  };
});

import { getLrMediaUrl } from "@/features/lr-exam/api";
import type { LrReviewState } from "../loaders";
import { LrReview } from "./lr-review";

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";

function buildReviewState(): LrReviewState {
  return {
    exam: {
      id: "exam-1",
      title: "ETS 2026 Test 01",
      identity: "ETS 2026 · Test 01",
      breadcrumb: "TOEIC L&R",
      totalQuestions: 3,
      durationMinutes: 120,
      scoreScale: "990",
    },
    groups: [
      {
        id: "block-p3-1",
        audio: {
          assetId: "asset-p3-1",
          durationMs: 45_000,
        },
        questions: [
          {
            number: 32,
            prompt: "What are the speakers discussing?",
            choices: [
              { key: "A", text: "A schedule" },
              { key: "B", text: "A software error" },
              { key: "C", text: "A budget" },
              { key: "D", text: "A trip" },
            ],
            selected: "A",
            correct: "B",
            analysis: {
              summary: "Woman mentions a software error.",
              skill: "Listening Part 3",
            },
          },
          {
            number: 33,
            prompt: "Where is the man going?",
            choices: [
              { key: "A", text: "Office" },
              { key: "B", text: "Airport" },
              { key: "C", text: "Lab" },
              { key: "D", text: "Factory" },
            ],
            selected: "C",
            correct: "C",
            analysis: {
              summary: "Man goes to the lab.",
              skill: "Listening Part 3",
            },
          },
        ],
      },
      {
        id: "block-p3-2",
        audio: {
          assetId: "asset-p3-2",
          durationMs: 30_000,
        },
        questions: [
          {
            number: 35,
            prompt: "What does the speaker offer?",
            choices: [
              { key: "A", text: "Discount" },
              { key: "B", text: "Refund" },
              { key: "C", text: "Replacement" },
              { key: "D", text: "Upgrade" },
            ],
            selected: "D",
            correct: "D",
            analysis: {
              summary: "Speaker offers an upgrade.",
              skill: "Listening Part 3",
            },
          },
        ],
      },
      {
        id: "block-p5-1",
        questions: [
          {
            number: 101,
            prompt: "The report was ____ on time.",
            choices: [
              { key: "A", text: "submit" },
              { key: "B", text: "submitted" },
              { key: "C", text: "submitting" },
              { key: "D", text: "submission" },
            ],
            selected: "B",
            correct: "B",
            analysis: {
              summary: "Passive voice participle.",
              skill: "Reading Part 5",
            },
          },
        ],
      },
    ],
    statuses: {
      32: "wrong",
      33: "correct",
      35: "correct",
      101: "correct",
    },
    counts: { correct: 3, wrong: 1, skipped: 0, flagged: 0 },
    flags: {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getLrMediaUrl).mockReset();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
    Promise.resolve(),
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LrReview lazy audio player", () => {
  it("renders ReviewAudioPlayer for Part 1-4 with pre-populated duration, lazy-loads & caches by assetId, and hides for Part 5-7", async () => {
    vi.mocked(getLrMediaUrl)
      .mockResolvedValueOnce({
        url: "https://minio.example.test/p3-1.mp3",
        expiresAtUtc: "2026-11-19T12:00:00Z",
      })
      .mockResolvedValueOnce({
        url: "https://minio.example.test/p3-2.mp3",
        expiresAtUtc: "2026-11-19T12:00:00Z",
      });

    render(
      <LrReview
        state={buildReviewState()}
        resultHref="/result"
        attemptId={ATTEMPT_ID}
      />,
    );

    const playerRegion = screen.getByTestId("lr-review-audio-player");
    expect(screen.getByRole("region", { name: "Audio xem lại câu hỏi" })).toBe(
      playerRegion,
    );
    expect(screen.getByText(/00:00\s*\/\s*00:45/)).toBeInTheDocument();
    expect(getLrMediaUrl).not.toHaveBeenCalled();

    // Click Play on Q32 -> fetches asset-p3-1 once.
    fireEvent.click(screen.getByTestId("lr-review-audio-toggle"));
    await waitFor(() =>
      expect(getLrMediaUrl).toHaveBeenCalledWith(
        ATTEMPT_ID,
        "audio",
        "asset-p3-1",
      ),
    );
    expect(getLrMediaUrl).toHaveBeenCalledTimes(1);

    // Playback speed control supports 0.8x, 1.0x, 1.2x.
    const speedControl = screen.getByTestId("lr-review-audio-speed");
    const audioEl = playerRegion.querySelector("audio") as HTMLAudioElement;
    expect(audioEl).not.toBeNull();
    if (speedControl.tagName === "SELECT") {
      fireEvent.change(speedControl, { target: { value: "1.2" } });
    } else {
      fireEvent.click(speedControl);
    }
    expect(audioEl.playbackRate).toBe(1.2);

    // Seekbar updates currentTime.
    const seekbar = screen.getByTestId("lr-review-audio-seek");
    fireEvent.change(seekbar, { target: { value: "15" } });
    expect(audioEl.currentTime).toBe(15);

    // Switch to Q33 (same audioAssetId: asset-p3-1) -> reuses cache without calling getLrMediaUrl again.
    fireEvent.click(screen.getByRole("button", { name: /^Câu 33\b/ }));
    fireEvent.click(screen.getByTestId("lr-review-audio-toggle"));
    expect(getLrMediaUrl).toHaveBeenCalledTimes(1);

    // Switch to Q35 (different audioAssetId: asset-p3-2) -> fetches asset-p3-2.
    fireEvent.click(screen.getByRole("button", { name: /^Câu 35\b/ }));
    expect(screen.getByText(/00:00\s*\/\s*00:30/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("lr-review-audio-toggle"));
    await waitFor(() =>
      expect(getLrMediaUrl).toHaveBeenCalledWith(
        ATTEMPT_ID,
        "audio",
        "asset-p3-2",
      ),
    );
    expect(getLrMediaUrl).toHaveBeenCalledTimes(2);

    // Switch to Q101 (Part 5) -> ReviewAudioPlayer must NOT render.
    fireEvent.click(screen.getByRole("button", { name: /^Câu 101\b/ }));
    expect(
      screen.queryByTestId("lr-review-audio-player"),
    ).not.toBeInTheDocument();
  });

  it("shows an error state when lazy-loading review audio fails", async () => {
    vi.mocked(getLrMediaUrl).mockRejectedValueOnce(new Error("Network error"));

    render(
      <LrReview
        state={buildReviewState()}
        resultHref="/result"
        attemptId={ATTEMPT_ID}
      />,
    );

    fireEvent.click(screen.getByTestId("lr-review-audio-toggle"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("renders Screen 19 filter tabs (Tất cả, Làm sai, Bỏ qua, Sai / Bỏ qua, Gắn cờ, Đúng) and /history link", () => {
    render(
      <LrReview
        state={buildReviewState()}
        resultHref="/result"
        attemptId={ATTEMPT_ID}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Về lịch sử làm bài" }),
    ).toHaveAttribute("href", "/history");
    for (const label of [
      /Tất cả/,
      /Làm sai \(1\)/,
      /Bỏ qua \(0\)/,
      /Sai \/ Bỏ qua \(1\)/,
      /Gắn cờ \(0\)/,
      /Đúng \(3\)/,
    ]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });
});
