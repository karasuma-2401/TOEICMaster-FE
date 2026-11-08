// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MicCheckPanel } from "./mic-check-panel";

afterEach(cleanup);

describe("MicCheckPanel", () => {
  it("requires a microphone decision before starting", () => {
    const onRequestAccess = vi.fn();
    render(
      <MicCheckPanel
        onRequestAccess={onRequestAccess}
        onStart={vi.fn()}
        status="idle"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Bắt đầu làm bài →" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cho phép micro" }));
    expect(onRequestAccess).toHaveBeenCalledOnce();
  });

  it("unlocks a test once the microphone picks up a voice", () => {
    const panel = (level: number) => (
      <MicCheckPanel
        level={level}
        onRequestAccess={vi.fn()}
        onStart={vi.fn()}
        status="ready"
      />
    );
    const { rerender } = render(panel(0));
    const start = screen.getByRole("button", { name: "Bắt đầu làm bài →" });

    expect(start).toBeDisabled();
    rerender(panel(0.5));
    return vi.waitFor(() => expect(start).toBeEnabled());
  });

  it("lets Part practice run on timers when the microphone is denied", () => {
    const onStart = vi.fn();
    render(
      <MicCheckPanel
        onRequestAccess={vi.fn()}
        onStart={onStart}
        requireDevices={false}
        status="denied"
      />,
    );

    expect(screen.getByText("Micro đang bị chặn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu làm bài →" }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
