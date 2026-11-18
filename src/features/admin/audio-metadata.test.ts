// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readAudioDurationMs } from "./audio-metadata";

class FakeAudioElement {
  preload = "";
  duration = 0;
  private listeners = new Map<string, Array<() => void>>();

  addEventListener(event: string, listener: () => void) {
    const list = this.listeners.get(event) ?? [];
    list.push(listener);
    this.listeners.set(event, list);
  }

  removeEventListener(event: string, listener: () => void) {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      list.filter((item) => item !== listener),
    );
  }

  emit(event: string) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener();
    }
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("readAudioDurationMs", () => {
  it("extracts duration in milliseconds on loadedmetadata and revokes object URL", async () => {
    const fakeAudio = new FakeAudioElement();
    fakeAudio.duration = 18.543;
    const createObjectURL = vi.fn().mockReturnValue("blob:audio-1");
    const revokeObjectURL = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    vi.stubGlobal(
      "Audio",
      vi.fn(function AudioStub() {
        queueMicrotask(() => fakeAudio.emit("loadedmetadata"));
        return fakeAudio;
      }),
    );

    const file = new File(["mp3"], "part1.mp3", { type: "audio/mpeg" });
    const result = await readAudioDurationMs(file);

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(result).toBe(18543);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:audio-1");
  });

  it("returns null on error or non-finite duration and still revokes object URL", async () => {
    const fakeAudio = new FakeAudioElement();
    fakeAudio.duration = Number.NaN;
    const createObjectURL = vi.fn().mockReturnValue("blob:audio-bad");
    const revokeObjectURL = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    vi.stubGlobal(
      "Audio",
      vi.fn(function AudioStub() {
        queueMicrotask(() => fakeAudio.emit("error"));
        return fakeAudio;
      }),
    );

    const file = new File(["bad"], "broken.mp3", { type: "audio/mpeg" });
    const result = await readAudioDurationMs(file);

    expect(result).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:audio-bad");
  });
});
