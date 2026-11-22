// @vitest-environment jsdom
import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MicSessionProvider, useMicSession } from "./mic-session-provider";

const route = vi.hoisted(() => ({ pathname: "/speaking/tests/test/practice" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

function fakeStream() {
  const track = Object.assign(new EventTarget(), {
    readyState: "live",
    label: "Test microphone",
    getSettings: () => ({ deviceId: "mic-1" }),
    stop: vi.fn(),
  });
  track.stop.mockImplementation(() => {
    track.readyState = "ended";
  });
  return {
    track,
    stream: { getAudioTracks: () => [track], getTracks: () => [track] },
  };
}
class FakeAudioContext {
  state = "running";
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  createAnalyser() {
    return {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteTimeDomainData: (buffer: Uint8Array) => buffer.fill(128),
    };
  }
  createMediaStreamSource() {
    return { connect: vi.fn() };
  }
}
function Controls() {
  const mic = useMicSession();
  return (
    <>
      <output>{mic.status}</output>
      <button
        onClick={() => {
          void mic.acquire();
          void mic.acquire();
        }}
        type="button"
      >
        Acquire
      </button>
      <button onClick={() => void mic.restoreIfGranted()} type="button">
        Restore
      </button>
      <button onClick={mic.release} type="button">
        Release
      </button>
    </>
  );
}
const ui = () => (
  <StrictMode>
    <MicSessionProvider>
      <Controls />
    </MicSessionProvider>
  </StrictMode>
);
let media: ReturnType<typeof fakeStream>;
let getUserMedia: ReturnType<typeof vi.fn>;
let query: ReturnType<typeof vi.fn>;
beforeEach(() => {
  route.pathname = "/speaking/tests/test/practice";
  media = fakeStream();
  getUserMedia = vi.fn().mockResolvedValue(media.stream);
  query = vi.fn().mockResolvedValue({ state: "prompt" });
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("MediaRecorder", class {});
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue([]),
    },
    permissions: { query },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("MicSessionProvider", () => {
  it("acquires once in StrictMode, shares the stream across routes, and releases on exit", async () => {
    const view = render(ui());
    expect(getUserMedia).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Acquire"));
    await vi.waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("ready"),
    );
    expect(getUserMedia).toHaveBeenCalledOnce();
    route.pathname = "/speaking/attempts/attempt";
    view.rerender(ui());
    fireEvent.click(screen.getByText("Acquire"));
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(media.track.stop).not.toHaveBeenCalled();
    route.pathname = "/speaking";
    view.rerender(ui());
    expect(media.track.stop).toHaveBeenCalledOnce();
  });

  it.each(["prompt", "denied"])(
    "does not reopen the microphone when permission is %s",
    async (state) => {
      query.mockResolvedValue({ state });
      render(ui());
      await act(async () => fireEvent.click(screen.getByText("Restore")));
      expect(getUserMedia).not.toHaveBeenCalled();
    },
  );

  it("treats unsupported permission queries as unknown", async () => {
    query.mockRejectedValue(new TypeError("Unsupported permission"));
    render(ui());
    await act(async () => fireEvent.click(screen.getByText("Restore")));
    expect(screen.getByRole("status")).toHaveTextContent("idle");
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("restores automatically only when permission is granted", async () => {
    query.mockResolvedValue({ state: "granted" });
    render(ui());
    fireEvent.click(screen.getByText("Restore"));
    await vi.waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("ready"),
    );
    expect(getUserMedia).toHaveBeenCalledOnce();
  });

  it.each([
    ["NotAllowedError", "denied"],
    ["NotFoundError", "no-device"],
    ["NotReadableError", "busy"],
  ])("maps %s to %s", async (name, status) => {
    getUserMedia.mockRejectedValue(new DOMException("Error", name));
    render(ui());
    fireEvent.click(screen.getByText("Acquire"));
    await vi.waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(status),
    );
  });

  it("stops a stream if permission resolves after leaving the flow", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(ui());
    fireEvent.click(screen.getByText("Acquire"));
    fireEvent.click(screen.getByText("Release"));
    await act(async () => resolve(media.stream));
    expect(media.track.stop).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("idle");
  });

  it("detects disconnection and stops all device resources", async () => {
    render(ui());
    fireEvent.click(screen.getByText("Acquire"));
    await vi.waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("ready"),
    );
    act(() => media.track.dispatchEvent(new Event("ended")));
    expect(screen.getByRole("status")).toHaveTextContent("lost");
    expect(media.track.stop).toHaveBeenCalledOnce();
  });
});
