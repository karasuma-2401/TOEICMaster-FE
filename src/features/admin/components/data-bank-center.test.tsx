// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      screen.getByRole("heading", { name: "Data Bank" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Part 1: Photographs")).toBeInTheDocument(),
    );
    expect(screen.getByText("3 questions")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Part 1: Photographs/i }),
    );

    expect(router.replace).toHaveBeenCalledWith("/admin/exams?part=1", {
      scroll: false,
    });
  });

  it("presents Listening & Reading as the active orange data-bank scope", async () => {
    render(<DataBankCenter />);

    expect(
      screen.getByRole("heading", { name: "Data Bank" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Listening & Reading" }),
    ).toHaveAttribute("href", "/admin/exams");
    expect(screen.getByRole("link", { name: "Speaking" })).toHaveAttribute(
      "href",
      "/admin/content/speaking",
    );
    expect(screen.getByRole("link", { name: "Writing" })).toHaveAttribute(
      "href",
      "/admin/content/writing",
    );
    expect(screen.getByRole("link", { name: "Tests" })).toHaveAttribute(
      "href",
      "/admin/exams?tab=tests",
    );
  });

  it("uses the shared red-orange primary action style for creating a complete test", async () => {
    url = "tab=tests";

    render(<DataBankCenter />);

    expect(
      await screen.findByRole("button", { name: "Create new test" }),
    ).toHaveClass("admin-primary-action");
  });

  it("renders the exam-management metrics from the loaded API data", async () => {
    url = "tab=tests";
    vi.mocked(getReadingExams).mockResolvedValue({
      items: [
        {
          examId: "11111111-1111-4111-8111-111111111111",
          revisionId: "22222222-2222-4222-8222-222222222222",
          code: "LR-2026-001",
          title: "ETS 2026 Test 01",
          versionNumber: 1,
          status: "Published",
          createdAtUtc: "2026-11-01T00:00:00Z",
        },
        {
          examId: "33333333-3333-4333-8333-333333333333",
          revisionId: "44444444-4444-4444-8444-444444444444",
          code: "LR-2026-002",
          title: "ETS 2026 Test 02",
          versionNumber: 1,
          status: "Draft",
          createdAtUtc: "2026-11-02T00:00:00Z",
        },
      ],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    vi.mocked(getScoreProfiles).mockResolvedValue([
      {
        id: "55555555-5555-4555-8555-555555555555",
        name: "ETS standard",
        isComplete: true,
        mappingCount: 202,
      },
    ]);

    render(<DataBankCenter />);

    expect(await screen.findByText("PUBLISHED TESTS")).toBeInTheDocument();
    expect(screen.getByText("1 test")).toBeInTheDocument();
    expect(screen.getByText("1 draft")).toBeInTheDocument();
    expect(screen.getByText("1 standard profile")).toBeInTheDocument();
  });

  it("filters the visible exam rows by code or title without changing the API contract", async () => {
    url = "tab=tests";
    vi.mocked(getReadingExams).mockResolvedValue({
      items: [
        {
          examId: "11111111-1111-4111-8111-111111111111",
          revisionId: "22222222-2222-4222-8222-222222222222",
          code: "LR-2026-001",
          title: "ETS Spring",
          versionNumber: 1,
          status: "Published",
          createdAtUtc: "2026-11-01T00:00:00Z",
        },
        {
          examId: "33333333-3333-4333-8333-333333333333",
          revisionId: "44444444-4444-4444-8444-444444444444",
          code: "LR-2026-002",
          title: "ETS Autumn",
          versionNumber: 1,
          status: "Draft",
          createdAtUtc: "2026-11-02T00:00:00Z",
        },
      ],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    render(<DataBankCenter />);

    await screen.findByText("ETS Spring");
    fireEvent.change(
      screen.getByPlaceholderText("Search L&R test code or title..."),
      {
        target: { value: "Autumn" },
      },
    );

    expect(screen.queryByText("ETS Spring")).not.toBeInTheDocument();
    expect(screen.getByText("ETS Autumn")).toBeInTheDocument();
  });

  it("keeps the cancel action centered in the create-test modal footer", async () => {
    url = "tab=tests";

    render(<DataBankCenter />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Create new test" }),
    );

    expect(await screen.findByRole("button", { name: "Cancel" })).toHaveClass(
      "justify-self-center",
    );
  });

  it("offers the complete 200-question Excel template in the exam-import modal without master-audio requirement", async () => {
    url = "tab=tests";

    render(<DataBankCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Import test" }));

    expect(
      await screen.findByRole("link", {
        name: /Download 200-question Excel template/i,
      }),
    ).toHaveAttribute("href", "/api/admin/exams/import-template");
    expect(
      screen.queryByText(/master audio is required/i),
    ).not.toBeInTheDocument();
  });

  it("shows only the question workspace after an admin opens a Part", async () => {
    url = "part=7";

    render(<DataBankCenter />);

    expect(
      screen.getByRole("heading", { name: /Part 7: Reading Comprehension/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Data Bank" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Exercises" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Tests" }),
    ).not.toBeInTheDocument();
  });

  it("renders Data Bank modals via Radix Dialog with accessible title, description, Escape handling, and focus restoration", async () => {
    const user = userEvent.setup();
    url = "tab=tests";

    render(<DataBankCenter />);
    const opener = await screen.findByRole("button", {
      name: "Create new test",
    });
    await user.click(opener);

    const dialog = await screen.findByRole("dialog", {
      name: "Create new test",
    });
    expect(dialog).toHaveAttribute("data-testid", "data-bank-modal");
    expect(dialog).toHaveAccessibleDescription(
      "The system creates a draft with exactly 200 slots. You can then enter questions, context, and media in the workspace.",
    );
    expect(document.querySelectorAll("dialog")).toHaveLength(0);
    expect(dialog.contains(document.activeElement)).toBe(true);

    const codeInput = screen.getByLabelText(/Test code/i);
    codeInput.focus();
    for (let step = 0; step < 8; step++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
  });

  it("keeps keyboard focus inside the exercise drawer and restores it on Escape", async () => {
    const user = userEvent.setup();
    url = "part=1";
    render(<DataBankCenter />);
    const opener = await screen.findByRole("button", { name: "Add question" });
    await user.click(opener);
    const drawer = screen.getByRole("dialog", { name: "Add new question" });
    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(drawer.contains(document.activeElement)).toBe(true);
    for (let step = 0; step < 8; step++) {
      await user.tab();
      expect(drawer.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Add new question" }),
      ).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
  });
});
