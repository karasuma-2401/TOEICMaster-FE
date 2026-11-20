// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/features/user/profile";
import { ProfileWorkspace } from "./profile-workspace";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/history/api", () => ({
  fetchUnifiedHistory: vi.fn().mockResolvedValue({
    items: [],
    unauthenticatedSkills: [],
  }),
}));

const sampleProfile: UserProfile = {
  id: "user-1",
  displayName: "Nguyễn Văn A",
  email: "learner@example.com",
  phone: "0912345678",
  dateOfBirth: "1998-05-12",
  targetScore: 800,
  avatarVersion: null,
  hasPassword: true,
};

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ProfileWorkspace", () => {
  it("renders all 4 single-page sections vertically without tabs and persists real settings", async () => {
    const user = userEvent.setup();
    render(<ProfileWorkspace profile={sampleProfile} />);

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByTestId("profile-section-details")).toBeInTheDocument();
    expect(screen.getByTestId("profile-section-history")).toBeInTheDocument();
    expect(screen.getByTestId("profile-section-security")).toBeInTheDocument();
    expect(screen.getByTestId("profile-section-settings")).toBeInTheDocument();

    expect(screen.getByLabelText("Ngày sinh")).toHaveValue("1998-05-12");

    const rateSelect = screen.getByLabelText("Tốc độ mặc định");
    await user.selectOptions(rateSelect, "1.2");
    expect(localStorage.getItem("toeicmaster-review-audio-rate")).toBe("1.2");

    const mascotToggle = screen.getByRole("checkbox", {
      name: /Ẩn trợ lý Míc/,
    });
    await user.click(mascotToggle);
    expect(localStorage.getItem("toeicmaster-mascot-hidden")).toBe("1");
  });
});
