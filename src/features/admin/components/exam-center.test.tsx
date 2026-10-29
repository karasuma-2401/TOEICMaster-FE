// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExamCenter } from "./exam-center";

const router = { replace: vi.fn(), push: vi.fn() };
let url = "";
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/exams",
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(url),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/admin/exam-api", () => ({
  getReadingExams: vi.fn(),
  getWritingTests: vi.fn(),
  getScoreProfiles: vi.fn(),
  createReadingExam: vi.fn(),
  createWritingTest: vi.fn(),
  importReadingExam: vi.fn(),
}));

import { getReadingExams } from "@/features/admin/exam-api";

beforeEach(() => {
  vi.clearAllMocks();
  url = "";
  vi.mocked(getReadingExams).mockResolvedValue({
    items: [],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
});

describe("ExamCenter", () => {
  it("renders the Reading management entry point and an honest empty state", async () => {
    render(<ExamCenter />);

    expect(
      screen.getByRole("heading", { name: "Quản lý đề thi" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Reading/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await waitFor(() =>
      expect(
        screen.getByText("Chưa có đề Reading nào phù hợp"),
      ).toBeInTheDocument(),
    );
  });
});
