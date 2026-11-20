// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useSequentialListeningPlayer,
  type ListeningTrack,
} from "./use-sequential-listening-player";

function makeTracks(count: number, durationMs = 10_000): ListeningTrack[] {
  return Array.from({ length: count }, (_, index) => ({
    blockId: `block-${index + 1}`,
    part: 1,
    first: index + 1,
    last: index + 1,
    audioAssetId: `asset-${index + 1}`,
    url: `https://minio.example.test/audio-${index + 1}.mp3`,
    durationMs,
  }));
}

function LockHarness({
  attemptId,
  tracks,
}: {
  attemptId: string;
  tracks: ListeningTrack[];
}) {
  const {
    audioRef,
    isPlaying,
    error,
    togglePlay,
    onLoadedMetadata,
    onTimeUpdate,
    onEnded,
  } = useSequentialListeningPlayer({
    attemptId,
    tracks,
    enabled: true,
  });

  return (
    <div>
      <audio
        ref={audioRef}
        data-testid="audio"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      >
        <track kind="captions" />
      </audio>
      <button type="button" onClick={() => void togglePlay()}>
        Toggle
      </button>
      <div data-testid="is-playing">{String(isPlaying)}</div>
      <div data-testid="error">{error ?? ""}</div>
    </div>
  );
}

let blobSeq = 0;

beforeEach(() => {
  blobSeq = 0;
  sessionStorage.clear();

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => {
      blobSeq += 1;
      return `blob:lock-track-${blobSeq}`;
    }),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useSequentialListeningPlayer ETS pause lock", () => {
  it("does not pause playback when togglePlay is called after playback has started", async () => {
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementation(() => Promise.resolve());
    const pauseSpy = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response(new Blob(["mp3"]), { status: 200 })),
      ),
    );

    render(<LockHarness attemptId="attempt-lock-1" tracks={makeTracks(2)} />);

    const audio = screen.getByTestId("audio") as HTMLAudioElement;
    await waitFor(() => expect(audio.src).toBe("blob:lock-track-1"));

    const toggleButton = screen.getByRole("button", { name: "Toggle" });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("is-playing")).toHaveTextContent("true");
    });

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId("is-playing")).toHaveTextContent("true");
    });
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("resets isPlaying to false if audio.play() rejects so the learner can retry", async () => {
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValueOnce(new Error("Autoplay blocked"))
      .mockResolvedValueOnce(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response(new Blob(["mp3"]), { status: 200 })),
      ),
    );

    render(
      <LockHarness attemptId="attempt-lock-retry" tracks={makeTracks(1)} />,
    );

    const audio = screen.getByTestId("audio") as HTMLAudioElement;
    await waitFor(() => expect(audio.src).toBe("blob:lock-track-1"));

    const toggleButton = screen.getByRole("button", { name: "Toggle" });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("is-playing")).toHaveTextContent("false");
    });

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("is-playing")).toHaveTextContent("true");
    });
  });
});
