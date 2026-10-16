// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountControls } from "./account-controls";

const toast = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock("@/shared/ui/toast", () => ({ toast }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AccountControls", () => {
  it("shows the signed-in user and logs out", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          status: "authenticated",
          user: { id: "id", displayName: "Linh", email: "linh@example.com" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<AccountControls />);

    expect(await screen.findByText("Xin chào, Linh")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(
      await screen.findByRole("link", { name: "Đăng nhập" }),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/logout");
    expect(toast.success).toHaveBeenCalledWith("Đã đăng xuất.");
  });
});
