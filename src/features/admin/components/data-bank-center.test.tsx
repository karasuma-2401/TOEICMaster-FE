// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataBankCenter } from "./data-bank-center";

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
  createReadingExam: vi.fn(),
  getReadingExams: vi.fn(),
  getScoreProfiles: vi.fn(),
  importReadingExam: vi.fn(),
}));
vi.mock("@/features/admin/lr-exercise-bank-api", () => ({
  createLrExerciseItem: vi.fn(),
  getLrExerciseItems: vi.fn(),
  getLrExerciseSummary: vi.fn(),
  importLrExerciseItems: vi.fn(),
}));

import {
  getLrExerciseItems,
  getLrExerciseSummary,
} from "@/features/admin/lr-exercise-bank-api";
import { getReadingExams, getScoreProfiles } from "@/features/admin/exam-api";

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  url = "";
  vi.mocked(getLrExerciseItems).mockResolvedValue({
    items: [],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  vi.mocked(getReadingExams).mockResolvedValue({
    items: [],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  vi.mocked(getScoreProfiles).mockResolvedValue([]);
  vi.mocked(getLrExerciseSummary).mockResolvedValue({
    totalQuestionCount: 3,
    updatedAtUtc: "2026-10-29T00:00:00+00:00",
    parts: Array.from({ length: 7 }, (_, index) => ({
      part: index + 1,
      kind:
        index === 2 || index === 3 || index === 5 || index === 6
          ? "GROUP"
          : "SINGLE",
      itemCount: index === 0 ? 3 : 0,
      questionCount: index === 0 ? 3 : 0,
      updatedAtUtc: index === 0 ? "2026-10-29T00:00:00+00:00" : null,
    })),
  });
});

describe("DataBankCenter", () => {
  it("renders the fixed seven-Part L&R bank and selects a Part through the URL", async () => {
    render(<DataBankCenter />);

    expect(
      screen.getByRole("heading", { name: "Kho dữ liệu" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Part 1: Photographs")).toBeInTheDocument(),
    );
    expect(screen.getByText("3 câu")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Part 1: Photographs/i }),
    );

    expect(router.replace).toHaveBeenCalledWith("/admin/exams?part=1", {
      scroll: false,
    });
  });

  it("presents Listening & Reading as the active orange data-bank scope", async () => {
    render(<DataBankCenter />);

    await waitFor(() =>
      expect(screen.getByText("Listening & Reading")).toBeInTheDocument(),
    );
    expect(screen.getByText("Speaking")).toBeInTheDocument();
    expect(screen.getByText("Writing")).toBeInTheDocument();
    expect(screen.getByText("7 Part cố định")).toBeInTheDocument();
  });

  it("uses the shared red-orange primary action style for creating a complete test", async () => {
    url = "tab=tests";

    render(<DataBankCenter />);

    expect(
      await screen.findByRole("button", { name: "Tạo đề mới" }),
    ).toHaveClass("admin-primary-action");
  });

  it("keeps the cancel action centered in the create-test modal footer", async () => {
    url = "tab=tests";

    render(<DataBankCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Tạo đề mới" }));

    expect(await screen.findByRole("button", { name: "Hủy" })).toHaveClass(
      "justify-self-center",
    );
  });

  it("offers the complete 200-question Excel template in the exam-import modal", async () => {
    url = "tab=tests";

    render(<DataBankCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Import đề" }));

    expect(
      await screen.findByRole("link", { name: /Tải file Excel mẫu/i }),
    ).toHaveAttribute("href", "/api/admin/exams/import-template");
  });

  it("shows only the question workspace after an admin opens a Part", async () => {
    url = "part=7";

    render(<DataBankCenter />);

    expect(
      screen.getByRole("heading", { name: /Part 7: Reading Comprehension/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Kho dữ liệu" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Bài tập" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Đề thi" }),
    ).not.toBeInTheDocument();
  });
});
