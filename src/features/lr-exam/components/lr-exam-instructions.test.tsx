// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/user/components/user-menu", () => ({
  UserMenu: () => <div />,
}));

vi.mock("../api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api")>();
  return {
    ...actual,
    getLrOverview: vi.fn(),
    startLrAttempt: vi.fn(),
  };
});

import { getLrOverview, LrApiError, startLrAttempt } from "../api";
import { LrExamInstructions } from "./lr-exam-instructions";

const mockedGetLrOverview = vi.mocked(getLrOverview);
const mockedStartLrAttempt = vi.mocked(startLrAttempt);

describe("LrExamInstructions", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the instructions using the exam ID", async () => {
    mockedGetLrOverview.mockResolvedValue({
      examId: "demo-exam-id",
      code: "ETS-01",
      title: "ETS 2026 Test 01",
      totalQuestions: 200,
      listeningQuestions: 100,
      readingQuestions: 100,
      durationMinutes: 120,
      minScaledScore: 10,
      maxScaledScore: 990,
      activeAttemptId: null,
    });

    render(<LrExamInstructions examId="demo-exam-id" />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "ETS 2026 Test 01",
      }),
    ).toBeInTheDocument();
  });

  it("links to /login?next=... when starting an attempt requires authentication", async () => {
    mockedGetLrOverview.mockResolvedValue({
      examId: "demo-exam-id",
      code: "ETS-01",
      title: "ETS 2026 Test 01",
      totalQuestions: 200,
      listeningQuestions: 100,
      readingQuestions: 100,
      durationMinutes: 120,
      minScaledScore: 10,
      maxScaledScore: 990,
      activeAttemptId: null,
    });
    mockedStartLrAttempt.mockRejectedValue(
      new LrApiError(401, "Phiên đăng nhập đã hết hạn."),
    );

    render(<LrExamInstructions examId="demo-exam-id" />);

    await screen.findByRole("heading", { level: 1, name: "ETS 2026 Test 01" });

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "BẮT ĐẦU LÀM BÀI THI L&R" }),
    );

    const loginLink = await screen.findByRole("link", {
      name: /Đăng nhập để vào thi/i,
    });
    await waitFor(() => {
      expect(loginLink).toHaveAttribute(
        "href",
        "/login?next=%2Fexams%2Flr%2Fdemo-exam-id",
      );
    });
  });
});
