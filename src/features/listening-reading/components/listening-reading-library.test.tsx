// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLrAttemptHistory,
  getLrCatalog,
  LrApiError,
} from "@/features/lr-exam/api";
import { ListeningReadingLibrary } from "./listening-reading-library";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/lr-exam/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/lr-exam/api")>();
  return {
    ...actual,
    getLrCatalog: vi.fn(),
    getLrAttemptHistory: vi.fn(),
  };
});

vi.mock("@/features/history/api", () => ({
  fetchUnifiedHistory: vi.fn().mockResolvedValue({
    items: [],
    unauthenticatedSkills: [],
  }),
}));

vi.mock("@/shared/components/practice/skill-header", () => ({
  SkillHeader: ({ active }: { active: string }) => (
    <header data-testid="mock-skill-header">{active}</header>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

const sampleCatalog = [
  {
    examId: "exam-1",
    code: "ETS-2026-01",
    title: "ETS 2026 Test 01",
    versionNumber: 1,
    totalQuestions: 200,
    listeningQuestions: 100,
    readingQuestions: 100,
    durationMinutes: 120,
    minScaledScore: 10,
    maxScaledScore: 990,
    publishedAtUtc: "2026-11-18T00:00:00Z",
    activeAttemptId: null,
  },
];

describe("ListeningReadingLibrary", () => {
  it("computes real attemptCount and bestScore from completed L&R attempts and renders AttemptHistorySection", async () => {
    vi.mocked(getLrCatalog).mockResolvedValueOnce(sampleCatalog);
    vi.mocked(getLrAttemptHistory).mockResolvedValueOnce({
      items: [
        {
          attemptId: "a-1",
          examId: "exam-1",
          examTitle: "ETS 2026 Test 01",
          examCode: "ETS-2026-01",
          status: "Completed",
          listeningScaledScore: 410,
          readingScaledScore: 390,
          totalScaledScore: 800,
          isTimeExpired: false,
          startedAtUtc: "2026-11-10T08:00:00Z",
          submittedAtUtc: "2026-11-10T10:00:00Z",
          durationSeconds: 7000,
        },
        {
          attemptId: "a-2",
          examId: "exam-1",
          examTitle: "ETS 2026 Test 01",
          examCode: "ETS-2026-01",
          status: "Completed",
          listeningScaledScore: 445,
          readingScaledScore: 410,
          totalScaledScore: 855,
          isTimeExpired: false,
          startedAtUtc: "2026-11-15T08:00:00Z",
          submittedAtUtc: "2026-11-15T10:00:00Z",
          durationSeconds: 6800,
        },
        {
          attemptId: "a-3",
          examId: "exam-1",
          examTitle: "ETS 2026 Test 01",
          examCode: "ETS-2026-01",
          status: "InProgress",
          listeningScaledScore: null,
          readingScaledScore: null,
          totalScaledScore: null,
          isTimeExpired: false,
          startedAtUtc: "2026-11-18T08:00:00Z",
          submittedAtUtc: null,
          durationSeconds: null,
        },
      ],
      totalCount: 3,
      pageIndex: 1,
      pageSize: 50,
    });

    render(<ListeningReadingLibrary skill="listening" />);

    const heading = await screen.findByRole("heading", {
      name: "ETS 2026 Test 01",
    });
    const card = heading.closest("article") as HTMLElement;
    expect(within(card).getByText("Bạn đã thi 2 lần")).toBeInTheDocument();
    expect(within(card).getByText("Tốt nhất: 855 / 990")).toBeInTheDocument();
    expect(screen.getByTestId("attempt-history-section")).toBeInTheDocument();
  });

  it("still renders the L&R exam catalog when history returns 401", async () => {
    vi.mocked(getLrCatalog).mockResolvedValueOnce(sampleCatalog);
    vi.mocked(getLrAttemptHistory).mockRejectedValueOnce(
      new LrApiError(401, "Unauthorized"),
    );

    render(<ListeningReadingLibrary skill="reading" />);

    expect(
      await screen.findByRole("heading", { name: "ETS 2026 Test 01" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("attempt-history-section")).toBeInTheDocument();
  });
});
