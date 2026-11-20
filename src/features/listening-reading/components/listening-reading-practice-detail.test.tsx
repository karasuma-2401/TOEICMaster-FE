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

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/user/components/user-menu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

vi.mock("@/features/lr-exam/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/lr-exam/api")>();
  return {
    ...actual,
    getLrPracticeDetail: vi.fn(),
    submitLrPractice: vi.fn(),
  };
});

import {
  getLrPracticeDetail,
  LrApiError,
  submitLrPractice,
} from "@/features/lr-exam/api";
import { ListeningReadingPracticeDetail } from "./listening-reading-practice-detail";

const mockedGetDetail = vi.mocked(getLrPracticeDetail);
const mockedSubmit = vi.mocked(submitLrPractice);

describe("ListeningReadingPracticeDetail", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("links to /login?next=... when submitting without authentication returns 401", async () => {
    mockedGetDetail.mockResolvedValue({
      id: "item-1",
      part: 5,
      kind: "single",
      code: "P5-001",
      topic: "Grammar",
      difficulty: null,
      context: null,
      audioUrl: null,
      imageUrl: null,
      questions: [
        {
          id: "q-1",
          ordinal: 1,
          code: null,
          prompt: "Sample question",
          optionA: "Option A",
          optionB: "Option B",
          optionC: null,
          optionD: null,
        },
      ],
    });
    mockedSubmit.mockRejectedValue(
      new LrApiError(401, "Phiên đăng nhập đã hết hạn."),
    );

    render(
      <ListeningReadingPracticeDetail
        skill="reading"
        part="5"
        itemId="item-1"
      />,
    );

    expect(await screen.findByText("Sample question")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));

    const loginLink = await screen.findByRole("link", {
      name: /Đăng nhập ngay/i,
    });
    await waitFor(() => {
      expect(loginLink).toHaveAttribute(
        "href",
        "/login?next=%2Freading%2Fpractice%2F5%2Fitem-1",
      );
    });
  });
});
