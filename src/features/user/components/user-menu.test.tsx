// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
    displayName: "Nguyễn Văn A",
    email: "learner@example.com",
    avatarVersion: null,
  };

  it("hiển thị icon avatar tròn với chữ cái đầu khi đã đăng nhập", () => {
    render(<UserMenu initialUser={sampleUser} />);

    const avatarBtn = screen.getByRole("button", {
      name: "Mở hồ sơ cá nhân",
    });
    expect(avatarBtn).toBeInTheDocument();
    expect(avatarBtn).toHaveTextContent("NA");

    expect(
      screen.queryByRole("link", { name: "Đăng nhập" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Đăng ký" }),
    ).not.toBeInTheDocument();
  });

  it("mở popup Hồ sơ cá nhân khi bấm vào avatar và trả focus về avatar khi đóng", async () => {
    const user = userEvent.setup();
    render(<UserMenu initialUser={sampleUser} />);

    const avatarBtn = screen.getByRole("button", {
      name: "Mở hồ sơ cá nhân",
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(avatarBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Đóng" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(avatarBtn).toHaveFocus();
  });

  it("hiển thị nút Đăng nhập và Đăng ký khi chưa đăng nhập", () => {
    render(<UserMenu initialUser={null} />);

    expect(
      screen.queryByRole("button", { name: "Mở hồ sơ cá nhân" }),
    ).not.toBeInTheDocument();

    const loginLink = screen.getByRole("link", { name: "Đăng nhập" });
    const registerLink = screen.getByRole("link", { name: "Đăng ký" });
    const profileLink = screen.getByRole("link", { name: "Hồ sơ cá nhân" });

    expect(loginLink).toHaveAttribute("href", "/login");
    expect(registerLink).toHaveAttribute("href", "/register");
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  it("chuyển sang trạng thái chưa đăng nhập khi bấm Đăng xuất trong popup", async () => {
    const user = userEvent.setup();
    render(<UserMenu initialUser={sampleUser} />);

    await user.click(screen.getByRole("button", { name: "Mở hồ sơ cá nhân" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mở hồ sơ cá nhân" }),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng ký" })).toBeInTheDocument();
  });

  it("mở popup sẵn khi initialOpen = true", () => {
    render(<UserMenu initialOpen={true} initialUser={sampleUser} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("tải hồ sơ thật sau khi xác nhận session và đồng bộ lại khi phát event", async () => {
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
        displayName: "Nguyễn Văn B",
        avatarVersion: null,
      });

    render(<UserMenu />);
    const avatarButton = await screen.findByRole("button", {
      name: "Mở hồ sơ cá nhân",
    });
    expect(apiMocks.getProfile).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("img", { name: "Ảnh đại diện của Nguyễn Văn A" }),
    ).toBeInTheDocument();

    window.dispatchEvent(new Event("profile:updated"));
    await waitFor(() => expect(avatarButton).toHaveTextContent("NB"));
    expect(apiMocks.getProfile).toHaveBeenCalledTimes(2);
  });
});
