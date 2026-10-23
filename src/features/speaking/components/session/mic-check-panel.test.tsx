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
        questionCount={11}
        status="idle"
        totalSeconds={1060}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Bắt đầu làm bài" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cho phép micro" }));
    expect(onRequestAccess).toHaveBeenCalledOnce();
  });

  it("lets learners practise on timers when the microphone is denied", () => {
    const onStart = vi.fn();
    render(
      <MicCheckPanel
        onRequestAccess={vi.fn()}
        onStart={onStart}
        questionCount={3}
        status="denied"
        totalSeconds={120}
      />,
    );

    expect(screen.getByText("Không có quyền micro")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu làm bài" }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
