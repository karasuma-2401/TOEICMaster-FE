// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MicCheckPanel } from "./mic-check-panel";

const mocks = vi.hoisted(() => ({
  mic: {
    status: "idle",
    level: 0,
    devices: [],
    deviceId: "",
    verified: false,
    acquire: vi.fn(),
    verify: vi.fn(),
    resetVerification: vi.fn(),
  },
  stop: vi.fn(),
  start: vi.fn(),
}));
vi.mock("@/features/speaking/mic/mic-session-provider", async (original) => ({
  ...(await original<
    typeof import("@/features/speaking/mic/mic-session-provider")
  >()),
  useMicSession: () => mocks.mic,
}));
vi.mock("@/features/speaking/hooks/use-voice-recorder", () => ({
  useVoiceRecorder: () => ({
    start: mocks.start,
    stop: mocks.stop,
    recordings: { 1: { url: "blob:test" } },
  }),
}));
beforeEach(() => {
  Object.assign(mocks.mic, { status: "idle", level: 0, verified: false });
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("MicCheckPanel", () => {
  it("does not request permission on mount and requires all three steps", () => {
    const onStart = vi.fn();
    const { rerender } = render(<MicCheckPanel onStart={onStart} />);
    expect(mocks.mic.acquire).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Start test →" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Allow microphone" }));
    expect(mocks.mic.acquire).toHaveBeenCalledOnce();
    Object.assign(mocks.mic, { status: "ready", level: 0.5 });
    rerender(<MicCheckPanel onStart={onStart} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Record 5-second test" }),
    );
    act(() => vi.advanceTimersByTime(5000));
    const confirm = screen.getByRole("button", {
      name: "I can hear my recording clearly",
    });
    expect(confirm).toBeDisabled();
    fireEvent.ended(screen.getByLabelText("Test recording"));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(mocks.mic.verify).toHaveBeenCalledOnce();
    mocks.mic.verified = true;
    rerender(<MicCheckPanel onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: "Start test →" }));
    expect(onStart).toHaveBeenCalledWith(false);
  });

  it("does not pass a silent recording", () => {
    Object.assign(mocks.mic, { status: "ready", level: 0 });
    render(<MicCheckPanel onStart={vi.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Record 5-second test" }),
    );
    act(() => vi.advanceTimersByTime(5000));
    fireEvent.ended(screen.getByLabelText("Test recording"));
    expect(
      screen.getByRole("button", { name: "I can hear my recording clearly" }),
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Not enough voice signal detected",
    );
  });

  it("offers an explicit no-recording choice only for Part practice", () => {
    const onStart = vi.fn();
    const { rerender } = render(<MicCheckPanel onStart={onStart} />);
    expect(
      screen.queryByRole("button", { name: "Practice without recording" }),
    ).not.toBeInTheDocument();
    rerender(<MicCheckPanel onStart={onStart} requireDevices={false} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Practice without recording" }),
    );
    expect(onStart).toHaveBeenCalledWith(true);
  });
});
