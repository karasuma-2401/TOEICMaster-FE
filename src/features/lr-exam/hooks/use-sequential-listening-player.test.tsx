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
import {
  useSequentialListeningPlayer,
  type ListeningTrack,
} from "./use-sequential-listening-player";

function makeTracks(count: number, durationMs = 10_000): ListeningTrack[] {
  return Array.from({ length: count }, (_, index) => ({
    blockId: `block-${index + 1}`,
    part: index < 6 ? 1 : 2,
    first: index + 1,
    last: index + 1,
    audioAssetId: `asset-${index + 1}`,
    url: `https://minio.example.test/audio-${index + 1}.mp3`,
    durationMs,
  }));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function Harness({
  attemptId,
  tracks,
  enabled = true,
}: {
  attemptId: string;
  tracks: ListeningTrack[];
  enabled?: boolean;
}) {
  const {
    audioRef,
    activeIndex,
    activeTrack,
    isPlaying,
    isComplete,
    isBuffering,
    globalElapsedMs,
    totalDurationMs,
    togglePlay,
    onLoadedMetadata,
    onTimeUpdate,
    onEnded,
  } = useSequentialListeningPlayer({
    attemptId,
    tracks,
    enabled,
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
      <div data-testid="active-part">{activeTrack?.part ?? "none"}</div>
      <div data-testid="is-playing">{String(isPlaying)}</div>
      <div data-testid="is-complete">{String(isComplete)}</div>
      <div data-testid="is-buffering">{String(isBuffering)}</div>
      <div data-testid="elapsed-ms">{globalElapsedMs}</div>
      <div data-testid="total-ms">{totalDurationMs}</div>
    </div>
  );
}

let blobSeq = 0;
let createdUrls: string[] = [];
let revokedUrls: string[] = [];

beforeEach(() => {
  blobSeq = 0;
  createdUrls = [];
  revokedUrls = [];
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
      const url = `blob:track-${blobSeq}`;
      createdUrls.push(url);
      return url;
    }),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn((url: string) => {
      revokedUrls.push(url);
    }),
  });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useSequentialListeningPlayer", () => {
  it("cannot replay completed audio after ending or reloading", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(new Blob(["wav"]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const tracks = makeTracks(1);
    const first = render(
      <Harness attemptId="completed-attempt" tracks={tracks} />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("Toggle"));
    fireEvent.ended(screen.getByTestId("audio"));
    expect(screen.getByTestId("is-complete")).toHaveTextContent("true");
    fireEvent.click(screen.getByText("Toggle"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    first.unmount();
    render(<Harness attemptId="completed-attempt" tracks={tracks} />);
    expect(screen.getByTestId("is-complete")).toHaveTextContent("true");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("preloads audio blobs sequentially with concurrency 1 and a bounded sliding window", async () => {
    const pending = new Map<string, ReturnType<typeof deferred<Response>>>();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const d = deferred<Response>();
      pending.set(url, d);
      return d.promise;
    });
    vi.stubGlobal("fetch", fetchMock);

    const tracks = makeTracks(10);
    render(<Harness attemptId="attempt-seq" tracks={tracks} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(tracks[0].url);

    // While track 0 is still pending, track 1 must NOT start.
    expect(pending.has(tracks[1].url)).toBe(false);

    // Resolve tracks 0..6 one by one; sliding window ahead from index 0 must stop well before track 9.
    for (let i = 0; i < 6; i += 1) {
      await act(async () => {
        pending
          .get(tracks[i].url)
          ?.resolve(new Response(new Blob(["mp3"]), { status: 200 }));
        await Promise.resolve();
      });
    }

    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(6);
    expect(pending.has(tracks[9].url)).toBe(false);
  });

  it("updates virtual timeline totals on loadedmetadata and computes globalElapsedMs across tracks", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(new Blob(["mp3"]), { status: 200 })),
      );
    vi.stubGlobal("fetch", fetchMock);

    const tracks = [
      { ...makeTracks(1, 10_000)[0], blockId: "b1", first: 1, last: 1 },
      { ...makeTracks(1, 0)[0], blockId: "b2", first: 2, last: 2 },
    ];

    render(<Harness attemptId="attempt-timeline" tracks={tracks} />);
    expect(screen.getByTestId("total-ms")).toHaveTextContent("10000");

    const audio = screen.getByTestId("audio") as HTMLAudioElement;
    await waitFor(() => expect(audio.src).toContain("blob:track-"));

    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 12.5,
    });
    fireEvent.loadedMetadata(audio);
    expect(screen.getByTestId("total-ms")).toHaveTextContent("12500");

    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      writable: true,
      value: 4.2,
    });
    fireEvent.timeUpdate(audio);
    expect(screen.getByTestId("elapsed-ms")).toHaveTextContent("4200");

    fireEvent.ended(audio);
    await waitFor(() =>
      expect(screen.getByTestId("active-index")).toHaveTextContent("1"),
    );

    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 15,
    });
    fireEvent.loadedMetadata(audio);
    expect(screen.getByTestId("total-ms")).toHaveTextContent("27500");

    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      writable: true,
      value: 3,
    });
    fireEvent.timeUpdate(audio);
    expect(screen.getByTestId("elapsed-ms")).toHaveTextContent("15500");
  });

  it("shows buffering while waiting for next track, revokes consumed blob URLs, and aborts on unmount", async () => {
    const d0 = deferred<Response>();
    const d1 = deferred<Response>();
    const signals: AbortSignal[] = [];

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      const url = String(input);
      if (url.endsWith("audio-1.mp3")) return d0.promise;
      if (url.endsWith("audio-2.mp3")) return d1.promise;
      return deferred<Response>().promise;
    });
    vi.stubGlobal("fetch", fetchMock);

    const tracks = makeTracks(4);
    const { unmount } = render(
      <Harness attemptId="attempt-buffer" tracks={tracks} />,
    );

    await act(async () => {
      d0.resolve(new Response(new Blob(["t0"]), { status: 200 }));
      await Promise.resolve();
    });

    const audio = screen.getByTestId("audio") as HTMLAudioElement;
    await waitFor(() => expect(audio.src).toBe("blob:track-1"));

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    await waitFor(() =>
      expect(screen.getByTestId("is-playing")).toHaveTextContent("true"),
    );

    // Track 0 ends before track 1 blob has finished downloading.
    fireEvent.ended(audio);
    expect(screen.getByTestId("active-index")).toHaveTextContent("1");
    expect(screen.getByTestId("is-buffering")).toHaveTextContent("true");
    expect(revokedUrls).toContain("blob:track-1");

    // Track 1 finishes downloading -> buffering clears and audio plays.
    await act(async () => {
      d1.resolve(new Response(new Blob(["t1"]), { status: 200 }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId("is-buffering")).toHaveTextContent("false");
      expect(audio.src).toBe("blob:track-2");
    });

    unmount();
    expect(revokedUrls).toContain("blob:track-2");
    expect(signals.some((signal) => signal.aborted)).toBe(true);
  });

  it("persists activeIndex and currentTimeSec in sessionStorage and resumes from activeIndex after reload", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(new Blob(["mp3"]), { status: 200 })),
      );
    vi.stubGlobal("fetch", fetchMock);

    const tracks = makeTracks(4);
    const firstRender = render(
      <Harness attemptId="attempt-resume" tracks={tracks} />,
    );

    const audio = screen.getByTestId("audio") as HTMLAudioElement;
    await waitFor(() => expect(audio.src).toBe("blob:track-1"));

    fireEvent.ended(audio);
    await waitFor(() =>
      expect(screen.getByTestId("active-index")).toHaveTextContent("1"),
    );
    fireEvent.ended(audio);
    await waitFor(() =>
      expect(screen.getByTestId("active-index")).toHaveTextContent("2"),
    );

    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      writable: true,
      value: 4.5,
    });
    fireEvent.timeUpdate(audio);

    firstRender.unmount();
    fetchMock.mockClear();

    render(<Harness attemptId="attempt-resume" tracks={tracks} />);

    expect(screen.getByTestId("active-index")).toHaveTextContent("2");
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(tracks[2].url);
  });
});
