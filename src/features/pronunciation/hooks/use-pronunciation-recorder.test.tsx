// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePronunciationRecorder } from "./use-pronunciation-recorder";

class FakeTrack extends EventTarget {
  stop = vi.fn();
}

class FakeRecorder {
  static last: FakeRecorder | null = null;
  state: "inactive" | "recording" = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() {
    FakeRecorder.last = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["audio"]) });
    this.onstop?.();
  }
}

let track: FakeTrack;
let getUserMedia: ReturnType<typeof vi.fn>;
const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  track = new FakeTrack();
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  };
  getUserMedia = vi.fn().mockResolvedValue(stream);
  let count = 0;
  createObjectURL.mockImplementation(() => `blob:${++count}`);
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  // No AudioContext in jsdom: the hook must still record without a meter.
  vi.stubGlobal("AudioContext", undefined);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  createObjectURL.mockReset();
  revokeObjectURL.mockReset();
});

describe("usePronunciationRecorder", () => {
  it("records a take and hands it to onTake", async () => {
    const onTake = vi.fn();
    const { result } = renderHook(() => usePronunciationRecorder({ onTake }));
    await act(() => result.current.start());
    expect(result.current.status).toBe("recording");
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.stop());
    expect(result.current.status).toBe("idle");
    expect(result.current.take?.url).toBe("blob:1");
    expect(onTake).toHaveBeenCalledWith(
      expect.objectContaining({ url: "blob:1", peakLevel: 1 }),
    );
  });

  it("stops on its own after maxMs", async () => {
    const { result } = renderHook(() =>
      usePronunciationRecorder({ maxMs: 5000 }),
    );
    await act(() => result.current.start());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.status).toBe("idle");
    expect(result.current.take).not.toBeNull();
  });

  it("revokes the previous URL on a retake and on unmount", async () => {
    const { result, unmount } = renderHook(() => usePronunciationRecorder());
    await act(() => result.current.start());
    act(() => result.current.stop());
    await act(() => result.current.start());
    act(() => result.current.stop());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:1");
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:2");
    expect(track.stop).toHaveBeenCalled();
  });

  it("reports a denied permission", async () => {
    getUserMedia.mockRejectedValue(new DOMException("no", "NotAllowedError"));
    const { result } = renderHook(() => usePronunciationRecorder());
    await act(() => result.current.start());
    expect(result.current.status).toBe("denied");
  });

  it("reports unsupported browsers", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const { result } = renderHook(() => usePronunciationRecorder());
    await act(() => result.current.start());
    expect(result.current.status).toBe("unsupported");
  });

  it("drops the take when the microphone is unplugged", async () => {
    const onTake = vi.fn();
    const { result } = renderHook(() => usePronunciationRecorder({ onTake }));
    await act(() => result.current.start());
    act(() => {
      track.dispatchEvent(new Event("ended"));
    });
    expect(result.current.status).toBe("mic-lost");
    expect(onTake).not.toHaveBeenCalled();
  });

  it("discard drops the current take", async () => {
    const { result } = renderHook(() => usePronunciationRecorder());
    await act(() => result.current.start());
    act(() => result.current.stop());
    act(() => result.current.discard());
    expect(result.current.take).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:1");
  });
});
