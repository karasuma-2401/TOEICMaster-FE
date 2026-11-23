// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assessPronunciation, PronunciationApiError } from "../api";
import type { Take } from "../hooks/use-pronunciation-recorder";
import { findSound } from "../ipa-sounds";
import { PracticeRecorder } from "./practice-recorder";

vi.mock("../api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api")>()),
  assessPronunciation: vi.fn(),
}));

const recorder = vi.hoisted(() => ({
  status: "idle" as string,
  onTake: undefined as ((take: Take) => void) | undefined,
  take: null as Take | null,
  start: vi.fn(),
  stop: vi.fn(),
  discard: vi.fn(),
}));

vi.mock("../hooks/use-pronunciation-recorder", () => ({
  usePronunciationRecorder: ({ onTake }: { onTake: (take: Take) => void }) => {
    recorder.onTake = onTake;
    return {
      status: recorder.status,
      level: 0.5,
      elapsedMs: 1200,
      take: recorder.take,
      maxMs: 5000,
      start: recorder.start,
      stop: recorder.stop,
      discard: recorder.discard,
      release: vi.fn(),
    };
  },
}));

const sound = findSound("th-voiceless")!;
const take: Take = {
  blob: new Blob(["x"], { type: "audio/webm" }),
  url: "blob:take",
  durationMs: 1200,
  peakLevel: 0.6,
};
const result = {
  recognitionStatus: "Recognized" as const,
  referenceText: "think",
  recognizedText: "think",
  accuracyScore: 78,
  pronunciationScore: 80,
  completenessScore: 100,
  words: [
    {
      word: "think",
      accuracyScore: 78,
      errorType: "None",
      phonemes: [
        {
          phoneme: "θ",
          accuracyScore: 54,
          candidates: [
            { phoneme: "s", score: 71 },
            { phoneme: "θ", score: 54 },
          ],
        },
        { phoneme: "ɪ", accuracyScore: 92, candidates: [] },
      ],
    },
  ],
};

beforeEach(() => {
  recorder.status = "idle";
  recorder.take = null;
  vi.mocked(assessPronunciation).mockReset();
});

async function deliver(value: Take) {
  recorder.take = value;
  await act(async () => {
    recorder.onTake?.(value);
  });
}

describe("PracticeRecorder", () => {
  it("starts recording from the idle state", async () => {
    render(
      <PracticeRecorder
        onAssessed={() => {}}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    expect(screen.getByText("think")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Record" }));
    expect(recorder.start).toHaveBeenCalled();
  });

  it("shows the recording controls", async () => {
    recorder.status = "recording";
    render(
      <PracticeRecorder
        onAssessed={() => {}}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    expect(screen.getByText("Recording 1.2s / 5s")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(recorder.stop).toHaveBeenCalled();
  });

  it("assesses a take and shows the target score with a fix", async () => {
    vi.mocked(assessPronunciation).mockResolvedValue(result);
    const onAssessed = vi.fn();
    const { rerender } = render(
      <PracticeRecorder
        onAssessed={onAssessed}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    await deliver(take);
    rerender(
      <PracticeRecorder
        onAssessed={onAssessed}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    expect(assessPronunciation).toHaveBeenCalledWith(
      take.blob,
      "think",
      expect.any(AbortSignal),
    );
    expect(await screen.findByText("Needs more practice")).toBeInTheDocument();
    expect(screen.getAllByText("54%").length).toBeGreaterThan(0);
    expect(screen.getByText("Sound /θ/ accuracy")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Play back recording" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("θ: 54 points, target sound"),
    ).toBeInTheDocument();
    expect(screen.getByText(sound.confusions!.s)).toBeInTheDocument();
    expect(onAssessed).toHaveBeenCalledWith("th-voiceless");
    expect(
      screen.getByRole("button", { name: "Record again" }),
    ).toBeInTheDocument();
  });

  it("does not send a silent take", async () => {
    render(
      <PracticeRecorder
        onAssessed={() => {}}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    await deliver({ ...take, peakLevel: 0.01 });
    expect(assessPronunciation).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "No voice detected. Please try again closer to the microphone.",
      ),
    ).toBeInTheDocument();
  });

  it("asks to sign in on 401 and keeps the recording playable", async () => {
    vi.mocked(assessPronunciation).mockRejectedValue(
      new PronunciationApiError(
        "UNAUTHORIZED",
        "Sign in to get your pronunciation scored.",
        401,
      ),
    );
    const { rerender } = render(
      <PracticeRecorder
        onAssessed={() => {}}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    await deliver(take);
    rerender(
      <PracticeRecorder
        onAssessed={() => {}}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    const link = await screen.findByRole("link", { name: "Sign in" });
    expect(link).toHaveAttribute(
      "href",
      "/login?next=%2Fpronunciation%3Fsound%3Dth-voiceless",
    );
    expect(document.querySelector('audio[src="blob:take"]')).not.toBeNull();
  });

  it("offers a retry when the service is unavailable", async () => {
    vi.mocked(assessPronunciation)
      .mockRejectedValueOnce(
        new PronunciationApiError(
          "UNAVAILABLE",
          "Unable to score right now.",
          503,
        ),
      )
      .mockResolvedValueOnce(result);
    const { rerender } = render(
      <PracticeRecorder
        onAssessed={() => {}}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    await deliver(take);
    rerender(
      <PracticeRecorder
        onAssessed={() => {}}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to score right now.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Needs more practice")).toBeInTheDocument();
  });

  it("shows microphone permission help", () => {
    recorder.status = "denied";
    render(
      <PracticeRecorder
        onAssessed={() => {}}
        sound={sound}
        example={sound.examples[0]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Microphone permission",
    );
  });
});
