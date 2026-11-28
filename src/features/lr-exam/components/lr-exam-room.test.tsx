// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LrListeningPlaylistApi } from "../api";
import * as lrApi from "../api";
import { loadRoomState } from "../loaders";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { LrExamRoom } from "./lr-exam-room";

beforeEach(() => {
  push.mockReset();
  sessionStorage.clear();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
    Promise.resolve(),
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => "blob:room-audio"),
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
  vi.useRealTimers();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const samplePlaylist: LrListeningPlaylistApi = {
  items: [
    {
      blockId: "block-1",
      part: 1,
      firstQuestionNumber: 1,
      audioAssetId: "asset-1",
      durationMs: 15_000,
      url: "https://minio.example.test/p1-q1.mp3",
      expiresAtUtc: "2026-11-19T12:00:00Z",
    },
    {
      blockId: "block-2",
      part: 3,
      firstQuestionNumber: 32,
      audioAssetId: "asset-2",
      durationMs: 20_000,
      url: "https://minio.example.test/p3-q32.mp3",
      expiresAtUtc: "2026-11-19T12:00:00Z",
    },
  ],
};

const submittedResult: lrApi.LrResultApi = {
  attemptId: "attempt-room-1",
  examId: "exam-1",
  examCode: "TEST01",
  examTitle: "Test exam",
  listeningRawScore: 0,
  readingRawScore: 0,
  listeningScaledScore: 5,
  readingScaledScore: 5,
  totalScaledScore: 10,
  listeningMaxScaledScore: 495,
  readingMaxScaledScore: 495,
  maxScaledScore: 990,
  totalCorrect: 0,
  totalIncorrect: 0,
  totalSkipped: 200,
  isTimeExpired: true,
  startedAtUtc: "2026-11-25T00:00:00Z",
  submittedAtUtc: "2026-11-25T02:00:00Z",
  durationSeconds: 7200,
  parts: [],
};

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("LrExamRoom", () => {
  it("lets the learner answer and opens submit confirmation", () => {
    render(<LrExamRoom {...loadRoomState("x")} resultHref="/result" />);
    fireEvent.click(screen.getAllByRole("radio", { name: /D\./ })[0]);
    expect(
      screen.getAllByRole("radio", { checked: true }).length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Submit Exam" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm L&R Submission" }),
    );
    expect(push).toHaveBeenCalledWith("/result");
  });

  it("renders the reading phase with a locked listening palette", () => {
    render(<LrExamRoom {...loadRoomState("x", 147)} resultHref="/result" />);
    expect(screen.getByText("QUESTION 147")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Question 1(,|$)/ }),
    ).toBeDisabled();
  });

  it("renders a single ListeningMasterPlayer without per-block audio elements or seekbars", async () => {
    const state = loadRoomState("x");
    const { container } = render(
      <LrExamRoom
        {...state}
        attemptId="attempt-room-1"
        phase="listening"
        playlist={samplePlaylist}
        resultHref="/result"
      />,
    );

    const player = screen.getByTestId("lr-master-audio-player");
    expect(screen.getByRole("region", { name: "Listening audio player" })).toBe(
      player,
    );

    // Zero per-block <audio> elements: at most 1 unified <audio> element in DOM.
    expect(container.querySelectorAll("audio").length).toBeLessThanOrEqual(1);
    expect(player.querySelector('input[type="range"]')).toBeNull();

    expect(player).toHaveTextContent(/Part 1\s*·\s*Question 1/);
    expect(screen.getByTestId("lr-master-audio-time")).toHaveTextContent(
      /00:00\s*\/\s*00:35/,
    );

    const toggle = screen.getByTestId("lr-master-audio-toggle");
    expect(toggle).toHaveAccessibleName("Start Listening Audio");
    fireEvent.click(toggle);

    await waitFor(() => {
      const lockedButton = screen.getByTestId("lr-master-audio-toggle");
      expect(lockedButton).toHaveAccessibleName("Playing · Pause Locked");
      expect(lockedButton).toBeDisabled();
    });

    // Clicking again while disabled/locked does not pause playback.
    fireEvent.click(screen.getByTestId("lr-master-audio-toggle"));
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
  });

  it("does not render ListeningMasterPlayer during the reading phase", () => {
    render(
      <LrExamRoom
        {...loadRoomState("x", 147)}
        attemptId="attempt-room-2"
        phase="reading"
        playlist={samplePlaylist}
        resultHref="/result"
      />,
    );

    expect(
      screen.queryByTestId("lr-master-audio-player"),
    ).not.toBeInTheDocument();
  });

  it("opens and cancels abandonment without calling the API or navigating", () => {
    const abandonApi = vi.spyOn(lrApi, "abandonLrAttempt").mockResolvedValue();
    render(
      <LrExamRoom
        {...loadRoomState("x")}
        attemptId="attempt-room-1"
        resultHref="/result"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Abandon" }));
    expect(
      screen.getByRole("dialog", { name: "Abandon this exam attempt?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue Exam" })).toHaveFocus();
    expect(abandonApi).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continue Exam" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(abandonApi).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("confirms abandonment once and redirects only after the API succeeds", async () => {
    const pending = deferred<void>();
    const abandonApi = vi
      .spyOn(lrApi, "abandonLrAttempt")
      .mockReturnValue(pending.promise);
    render(
      <LrExamRoom
        {...loadRoomState("x")}
        attemptId="attempt-room-1"
        resultHref="/result"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Abandon" }));
    fireEvent.click(screen.getByRole("button", { name: "Abandon Exam" }));
    expect(abandonApi).toHaveBeenCalledWith("attempt-room-1");
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Abandoning…" }));
    expect(abandonApi).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/listening-reading");
  });

  it("closes the abandon modal on failure and lets the learner retry", async () => {
    const abandonApi = vi
      .spyOn(lrApi, "abandonLrAttempt")
      .mockRejectedValueOnce(new Error("Abandon service unavailable"))
      .mockResolvedValueOnce();
    render(
      <LrExamRoom
        {...loadRoomState("x")}
        attemptId="attempt-room-1"
        resultHref="/result"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Abandon" }));
    fireEvent.click(screen.getByRole("button", { name: "Abandon Exam" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Abandon service unavailable",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Abandon" }));
    fireEvent.click(screen.getByRole("button", { name: "Abandon Exam" }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/listening-reading"),
    );
    expect(abandonApi).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each(["none", "submit", "abandon"] as const)(
    "auto-submits on expiry, closes the %s modal, and exposes Retry Submit after failure",
    async (modal) => {
      vi.useFakeTimers();
      const saveApi = vi
        .spyOn(lrApi, "saveLrAnswers")
        .mockResolvedValue(undefined);
      const abandonApi = vi
        .spyOn(lrApi, "abandonLrAttempt")
        .mockResolvedValue();
      const submitApi = vi
        .spyOn(lrApi, "submitLrAttempt")
        .mockRejectedValueOnce(new Error("Submission service unavailable"))
        .mockResolvedValueOnce(submittedResult);
      vi.spyOn(lrApi, "getLrResult").mockRejectedValue(new Error("Not ready"));
      render(
        <LrExamRoom
          {...loadRoomState("x")}
          attemptId="attempt-room-1"
          initialRemainingSeconds={2}
          questionIds={{ 32: "question-32" }}
          resultHref="/result"
        />,
      );
      if (modal !== "none") {
        fireEvent.click(
          screen.getByRole("button", {
            name: modal === "submit" ? "Submit Exam" : "Abandon",
          }),
        );
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      }
      await act(async () => vi.advanceTimersByTimeAsync(2000));
      expect(submitApi).toHaveBeenCalledWith("attempt-room-1");
      expect(submitApi).toHaveBeenCalledTimes(1);
      expect(saveApi).toHaveBeenCalledTimes(1);
      expect(abandonApi).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Submission service unavailable",
      );
      expect(
        screen.getByRole("button", { name: "Retry Submit" }),
      ).toBeEnabled();
      await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Retry Submit" })),
      );
      expect(submitApi).toHaveBeenCalledTimes(2);
      expect(saveApi).toHaveBeenCalledTimes(2);
      expect(push).toHaveBeenCalledWith(
        "/exams/lr/attempts/attempt-room-1/result",
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );

  it("does not duplicate an in-flight manual submission when the timer expires", async () => {
    vi.useFakeTimers();
    const pending = deferred<lrApi.LrResultApi>();
    vi.spyOn(lrApi, "saveLrAnswers").mockResolvedValue(undefined);
    const submitApi = vi
      .spyOn(lrApi, "submitLrAttempt")
      .mockReturnValue(pending.promise);
    render(
      <LrExamRoom
        {...loadRoomState("x")}
        attemptId="attempt-room-1"
        initialRemainingSeconds={2}
        resultHref="/result"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit Exam" }));
    await act(async () =>
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm L&R Submission" }),
      ),
    );
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(submitApi).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => pending.reject(new Error("Submit failed")));
    expect(screen.getByRole("button", { name: "Retry Submit" })).toBeEnabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Submit failed");
  });
});
