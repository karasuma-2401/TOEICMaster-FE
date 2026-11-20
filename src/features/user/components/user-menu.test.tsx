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
    displayName: "Nguyễn Văn A",
    email: "learner@example.com",
    phone: "0912345678",
    dateOfBirth: null,
    targetScore: 750,
    avatarVersion: null,
    hasPassword: true,
  };

  it("hiển thị icon avatar tròn với chữ cái đầu khi đã đăng nhập", () => {
    render(<UserMenu initialUser={sampleUser} />);

    const avatarBtn = screen.getByTestId("user-menu-trigger");
    expect(avatarBtn).toHaveAccessibleName("Mở menu tài khoản");
    expect(avatarBtn).toHaveTextContent("NA");

    expect(
      screen.queryByRole("link", { name: "Đăng nhập" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Đăng ký" }),
    ).not.toBeInTheDocument();
  });

  it("mở dropdown menu với liên kết Hồ sơ cá nhân, Lịch sử làm bài và đóng bằng Escape hoặc click ngoài", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Ngoài menu</button>
        <UserMenu initialUser={sampleUser} />
      </div>,
    );

    const avatarBtn = screen.getByTestId("user-menu-trigger");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(avatarBtn);

    const menu = screen.getByRole("menu", { name: "Menu tài khoản" });
    expect(within(menu).getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(within(menu).getByText("learner@example.com")).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitem", { name: "Hồ sơ cá nhân" }),
    ).toHaveAttribute("href", "/profile");
    expect(
      within(menu).getByRole("menuitem", { name: "Lịch sử làm bài" }),
    ).toHaveAttribute("href", "/history");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(avatarBtn).toHaveFocus();

    await user.click(avatarBtn);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ngoài menu" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("hiển thị nút Đăng nhập và Đăng ký khi chưa đăng nhập", () => {
    render(<UserMenu initialUser={null} />);

    expect(screen.queryByTestId("user-menu-trigger")).not.toBeInTheDocument();

    const loginLink = screen.getByRole("link", { name: "Đăng nhập" });
    const registerLink = screen.getByRole("link", { name: "Đăng ký" });

    expect(loginLink).toHaveAttribute("href", "/login");
    expect(registerLink).toHaveAttribute("href", "/register");
    expect(
      screen.queryByRole("link", { name: "Hồ sơ cá nhân" }),
    ).not.toBeInTheDocument();
  });

  it("chuyển sang trạng thái chưa đăng nhập khi bấm Đăng xuất trong menu", async () => {
    const user = userEvent.setup();
    render(<UserMenu initialUser={sampleUser} />);

    await user.click(screen.getByTestId("user-menu-trigger"));

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Đăng xuất" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-menu-trigger")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng ký" })).toBeInTheDocument();
  });

  it("mở menu sẵn khi initialOpen = true", () => {
    render(<UserMenu initialOpen={true} initialUser={sampleUser} />);

    expect(screen.getByRole("menu")).toBeInTheDocument();
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
    const avatarButton = await screen.findByTestId("user-menu-trigger");
    expect(apiMocks.getProfile).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("img", { name: "Ảnh đại diện của Nguyễn Văn A" }),
    ).toBeInTheDocument();

    window.dispatchEvent(new Event("profile:updated"));
    await waitFor(() => expect(avatarButton).toHaveTextContent("NB"));
    expect(apiMocks.getProfile).toHaveBeenCalledTimes(2);
  });
});
