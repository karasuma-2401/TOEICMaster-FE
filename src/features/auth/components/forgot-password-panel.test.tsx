// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordPanel } from "./forgot-password-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ForgotPasswordPanel", () => {
  it("requests a recovery code before showing the verification step", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ForgotPasswordPanel />);

    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi mã xác minh" }));

    expect(
      await screen.findByRole("heading", { name: "Xác minh email" }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/forgot-password",
      expect.objectContaining({
        body: JSON.stringify({ email: "linh@example.com" }),
      }),
    );
  });
});
