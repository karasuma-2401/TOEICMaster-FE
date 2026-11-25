// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegisterPanel } from "./register-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RegisterPanel", () => {
  it("renders the registration form initially", () => {
    render(<RegisterPanel />);

    expect(
      screen.getByRole("heading", { name: "Start a new journey" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("moves to the verification OTP page upon successful registration and allows changing email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 202 })),
    );
    const user = userEvent.setup();
    render(<RegisterPanel />);

    await user.type(screen.getByLabelText("Display name"), "Linh");
    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByLabelText("I agree to the Terms of Use"));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByRole("heading", { name: "Verify email" }),
    ).toBeInTheDocument();
    expect(screen.getByText("VERIFY ACCOUNT")).toBeInTheDocument();
    expect(screen.getByText("linh@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Re-enter email" }));

    expect(
      await screen.findByRole("heading", { name: "Start a new journey" }),
    ).toBeInTheDocument();
  });

  it("uses WCAG AA --tm-* tokens instead of failing literal hex colors", () => {
    const { container } = render(<RegisterPanel />);
    expect(container.innerHTML).not.toMatch(
      /#(?:ed361c|b7aeaa|c9c1bd|c8c0bc|a89f9b|a8a09c|938b87|c0b8b4|b6b0ad|beb7b3|ff6c0d)/i,
    );
  });
});
