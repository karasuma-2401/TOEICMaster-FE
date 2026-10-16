// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ProfilePanel } from "./profile-panel";

afterEach(cleanup);

describe("ProfilePanel", () => {
  it("hiển thị ban đầu ở tab Thông tin và cho phép chuyển sang tab Bảo mật", async () => {
    const user = userEvent.setup();
    render(<ProfilePanel />);

    const infoTab = screen.getByRole("button", { name: "Thông tin" });
    const securityTab = screen.getByRole("button", { name: "Bảo mật" });

    expect(infoTab).toHaveAttribute("aria-current", "page");
    expect(securityTab).not.toHaveAttribute("aria-current");

    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Mật khẩu hiện tại"),
    ).not.toBeInTheDocument();

    // Chuyển tab sang Bảo mật
    await user.click(securityTab);

    expect(securityTab).toHaveAttribute("aria-current", "page");
    expect(infoTab).not.toHaveAttribute("aria-current");

    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tên hiển thị")).not.toBeInTheDocument();

    // Chuyển lại tab Thông tin
    await user.click(infoTab);

    expect(infoTab).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();
  });

  it("hiển thị thẻ thông tin cá nhân rút gọn trên mobile", () => {
    render(<ProfilePanel />);

    expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getAllByText("learner@example.com").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Trang chủ" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
