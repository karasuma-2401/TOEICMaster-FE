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

function RetryHarness({
  attemptId,
  tracks,
}: {
  attemptId: string;
  tracks: ListeningTrack[];
}) {
  const {
    audioRef,
    activeIndex,
    isPlaying,
    isBuffering,
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
      <div data-testid="active-index">{activeIndex}</div>
      <div data-testid="is-playing">{String(isPlaying)}</div>
      <div data-testid="is-buffering">{String(isBuffering)}</div>
      <div data-testid="error">{error ?? ""}</div>
    </div>
  );
}

let blobSeq = 0;

beforeEach(() => {
  blobSeq = 0;
  sessionStorage.clear();

  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
    Promise.resolve(),
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => {
      blobSeq += 1;
      return `blob:retry-track-${blobSeq}`;
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

describe("useSequentialListeningPlayer preloaded-track failure recovery", () => {
  it("retries a failed preloaded track on onEnded and clears buffering when retry succeeds", async () => {
    let track2Attempts = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("audio-2.mp3")) {
        track2Attempts += 1;
        if (track2Attempts === 1) {
          return Promise.resolve(new Response(null, { status: 502 }));
        }
      }
      return Promise.resolve(new Response(new Blob(["mp3"]), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const tracks = makeTracks(2);
    render(<RetryHarness attemptId="attempt-retry-ended" tracks={tracks} />);

    const audio = screen.getByTestId("audio") as HTMLAudioElement;
    await waitFor(() => expect(audio.src).toBe("blob:retry-track-1"));
    await waitFor(() => expect(track2Attempts).toBe(1));

    // Background failure on track 2 must not surface an error while track 1 is active.
    expect(screen.getByTestId("error")).toHaveTextContent("");

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    await waitFor(() =>
      expect(screen.getByTestId("is-playing")).toHaveTextContent("true"),
    );

    // Track 1 ends -> advances to track 2 and retries fetching audio-2.mp3.
    fireEvent.ended(audio);
    await waitFor(() => expect(track2Attempts).toBe(2));
    await waitFor(() => {
      expect(screen.getByTestId("active-index")).toHaveTextContent("1");
      expect(screen.getByTestId("is-buffering")).toHaveTextContent("false");
      expect(screen.getByTestId("is-playing")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("");
      expect(audio.src).toBe("blob:retry-track-2");
    });
  });

  it("surfaces error when retry fails while active and recovers on subsequent togglePlay", async () => {
    let track2Attempts = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("audio-2.mp3")) {
        track2Attempts += 1;
        if (track2Attempts <= 2) {
          return Promise.resolve(new Response(null, { status: 500 }));
        }
      }
      return Promise.resolve(new Response(new Blob(["mp3"]), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const tracks = makeTracks(2);
    render(<RetryHarness attemptId="attempt-retry-toggle" tracks={tracks} />);

    const audio = screen.getByTestId("audio") as HTMLAudioElement;
    await waitFor(() => expect(audio.src).toBe("blob:retry-track-1"));
    await waitFor(() => expect(track2Attempts).toBe(1));

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    await waitFor(() =>
      expect(screen.getByTestId("is-playing")).toHaveTextContent("true"),
    );

    // Track 1 ends -> track 2 retry fails while active -> clears buffering/playing and sets error.
    fireEvent.ended(audio);
    await waitFor(() => expect(track2Attempts).toBe(2));
    await waitFor(() => {
      expect(screen.getByTestId("active-index")).toHaveTextContent("1");
      expect(screen.getByTestId("is-buffering")).toHaveTextContent("false");
      expect(screen.getByTestId("is-playing")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Unable to load audio (500).",
      );
    });

    // User clicks togglePlay -> clears error, deletes failed index, retries track 2, and succeeds.
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    await waitFor(() => expect(track2Attempts).toBe(3));
    await waitFor(() => {
      expect(screen.getByTestId("is-buffering")).toHaveTextContent("false");
      expect(screen.getByTestId("is-playing")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("");
      expect(audio.src).toBe("blob:retry-track-2");
    });
  });
});
