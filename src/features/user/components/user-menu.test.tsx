// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { UserMenu } from "./user-menu";

afterEach(cleanup);

describe("UserMenu", () => {
  const sampleUser = {
    displayName: "Nguyễn Văn A",
    email: "learner@example.com",
    phone: "0912345678",
    dateOfBirth: "2000-01-15",
    targetScore: 750,
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

    expect(loginLink).toHaveAttribute("href", "/login");
    expect(registerLink).toHaveAttribute("href", "/register");
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
});
