// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "./user-menu";

const apiMocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock("@/features/auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/api")>();
  return { ...actual, getSession: apiMocks.getSession };
});
vi.mock("@/features/user/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user/api")>();
  return { ...actual, getProfile: apiMocks.getProfile };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

afterEach(cleanup);

describe("UserMenu", () => {
  const sampleUser = {
    id: "user-1",
    displayName: "Noah Adams",
    email: "learner@example.com",
    phone: "0912345678",
    dateOfBirth: null,
    targetScore: 750,
    avatarVersion: null,
    hasPassword: true,
  };

  it("renders a circular avatar icon with initials when signed in", () => {
    render(<UserMenu initialUser={sampleUser} />);

    const avatarBtn = screen.getByTestId("user-menu-trigger");
    expect(avatarBtn).toHaveAccessibleName("Open account menu");
    expect(avatarBtn).toHaveTextContent("NA");

    expect(
      screen.queryByRole("link", { name: "Sign in" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Sign up" }),
    ).not.toBeInTheDocument();
  });

  it("opens dropdown menu with Personal profile and Attempt history links and closes on Escape or outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Outside menu</button>
        <UserMenu initialUser={sampleUser} />
      </div>,
    );

    const avatarBtn = screen.getByTestId("user-menu-trigger");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(avatarBtn);

    const menu = screen.getByRole("menu", { name: "Account menu" });
    expect(within(menu).getByText("Noah Adams")).toBeInTheDocument();
    expect(within(menu).getByText("learner@example.com")).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitem", { name: "Personal profile" }),
    ).toHaveAttribute("href", "/profile");
    expect(
      within(menu).getByRole("menuitem", { name: "Attempt history" }),
    ).toHaveAttribute("href", "/history");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(avatarBtn).toHaveFocus();

    await user.click(avatarBtn);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Outside menu" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders Sign in and Sign up links when signed out", () => {
    render(<UserMenu initialUser={null} />);

    expect(screen.queryByTestId("user-menu-trigger")).not.toBeInTheDocument();

    const loginLink = screen.getByRole("link", { name: "Sign in" });
    const registerLink = screen.getByRole("link", { name: "Sign up" });

    expect(loginLink).toHaveAttribute("href", "/login");
    expect(registerLink).toHaveAttribute("href", "/register");
    expect(
      screen.queryByRole("link", { name: "Personal profile" }),
    ).not.toBeInTheDocument();
  });

  it("switches to signed-out state when clicking Sign out in the menu", async () => {
    const user = userEvent.setup();
    render(<UserMenu initialUser={sampleUser} />);

    await user.click(screen.getByTestId("user-menu-trigger"));

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-menu-trigger")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
  });

  it("opens the menu initially when initialOpen = true", () => {
    render(<UserMenu initialOpen={true} initialUser={sampleUser} />);

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("loads the full profile after confirming the session and syncs on profile:updated", async () => {
    apiMocks.getSession.mockResolvedValue({
      status: "authenticated",
      user: {
        id: "user-1",
        displayName: "Session name",
        email: "learner@example.com",
      },
    });
    apiMocks.getProfile
      .mockResolvedValueOnce({ ...sampleUser, avatarVersion: "v1" })
      .mockResolvedValueOnce({
        ...sampleUser,
        displayName: "Noah Baker",
        avatarVersion: null,
      });

    render(<UserMenu />);
    const avatarButton = await screen.findByTestId("user-menu-trigger");
    expect(apiMocks.getProfile).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("img", { name: "Avatar of Noah Adams" }),
    ).toBeInTheDocument();

    window.dispatchEvent(new Event("profile:updated"));
    await waitFor(() => expect(avatarButton).toHaveTextContent("NB"));
    expect(apiMocks.getProfile).toHaveBeenCalledTimes(2);
  });
});
