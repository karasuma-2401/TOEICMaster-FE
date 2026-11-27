// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RegisterForm", () => {
  it("shows local validation errors without submitting", async () => {
    const user = userEvent.setup();
    const onRegistrationAccepted = vi.fn();
    render(<RegisterForm onRegistrationAccepted={onRegistrationAccepted} />);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Please enter a display name."),
    ).toBeInTheDocument();
    expect(screen.getByText("Please enter your email.")).toBeInTheDocument();
    expect(screen.getByText("Please enter your password.")).toBeInTheDocument();
    expect(
      screen.getByText("Please agree to the terms of use."),
    ).toBeInTheDocument();
    expect(onRegistrationAccepted).not.toHaveBeenCalled();
  });

  it("invokes onRegistrationAccepted with trimmed email when valid", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const onRegistrationAccepted = vi.fn();
    render(<RegisterForm onRegistrationAccepted={onRegistrationAccepted} />);

    await user.type(screen.getByLabelText("Display name"), "Linh");
    await user.type(screen.getByLabelText("Email"), "  linh@example.com  ");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.type(screen.getByLabelText("Confirm password"), "password");
    await user.click(screen.getByLabelText("I agree to the Terms of Use"));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(onRegistrationAccepted).toHaveBeenCalledWith("linh@example.com");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.any(Object),
    );
  });

  it("requires consent before it submits the form", async () => {
    const user = userEvent.setup();
    const onRegistrationAccepted = vi.fn();
    render(<RegisterForm onRegistrationAccepted={onRegistrationAccepted} />);

    await user.type(screen.getByLabelText("Display name"), "Linh");
    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.type(screen.getByLabelText("Confirm password"), "password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Please agree to the terms of use."),
    ).toBeInTheDocument();
    expect(onRegistrationAccepted).not.toHaveBeenCalled();
  });

  it("requires terms before offering Google registration", () => {
    render(<RegisterForm onRegistrationAccepted={vi.fn()} />);
    expect(
      screen.getByText(
        "Please agree to the terms of use to continue with Google.",
      ),
    ).toBeInTheDocument();
  });

  it("uses WCAG AA --tm-* tokens instead of failing literal hex colors", () => {
    const { container } = render(
      <RegisterForm onRegistrationAccepted={vi.fn()} />,
    );
    expect(container.innerHTML).not.toMatch(
      /#(?:ed361c|b7aeaa|c9c1bd|c8c0bc|a89f9b|a8a09c|938b87|c0b8b4|b6b0ad|beb7b3|ff6c0d)/i,
    );
  });
});
