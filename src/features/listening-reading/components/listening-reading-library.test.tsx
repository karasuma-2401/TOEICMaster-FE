// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLrAttemptHistory,
  getLrCatalog,
  getLrPracticeItems,
  getLrPracticeStatistics,
  LrApiError,
  type LrExamCatalogItemApi,
  type LrPracticeItemPageApi,
} from "@/features/lr-exam/api";
import {
  ListeningReadingLibrary,
  ListeningReadingPractice,
} from "./listening-reading-library";

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
    getLrCatalog: vi.fn(),
    getLrAttemptHistory: vi.fn(),
    getLrPracticeItems: vi.fn(),
    getLrPracticeStatistics: vi.fn(),
  };
});

vi.mock("@/features/history/api", () => ({
  fetchUnifiedHistory: vi.fn().mockResolvedValue({
    items: [],
    unauthenticatedSkills: [],
  }),
}));

vi.mock("@/shared/components/practice/skill-header", () => ({
  SkillHeader: ({ active }: { active?: string }) => (
    <header data-testid="mock-skill-header">{active}</header>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getLrAttemptHistory).mockResolvedValue({
    items: [],
    totalCount: 0,
    pageIndex: 1,
    pageSize: 50,
  });
  vi.mocked(getLrPracticeStatistics).mockResolvedValue([]);
});

afterEach(cleanup);

const sampleExam: LrExamCatalogItemApi = {
  examId: "exam-1",
  code: "ETS-2026-01",
  title: "ETS 2026 Test 01",
  versionNumber: 1,
  totalQuestions: 200,
  listeningQuestions: 100,
  readingQuestions: 100,
  publishedAtUtc: "2026-11-18T00:00:00Z",
};

const samplePracticePage: LrPracticeItemPageApi = {
  items: [
    {
      id: "item-1",
      part: 1,
      kind: "single",
      code: "P1-01",
      topic: "Airport check-in",
      difficulty: "easy",
      context: null,
      audioUrl: null,
      imageUrl: null,
      questionCount: 1,
    },
  ],
  pageNumber: 1,
  pageSize: 50,
  totalCount: 1,
  totalPages: 1,
};

describe("ListeningReadingLibrary", () => {
  it("computes real attemptCount and bestScore from completed L&R attempts and renders AttemptHistorySection", async () => {
    vi.mocked(getLrCatalog).mockResolvedValueOnce([sampleExam]);
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

    render(<ListeningReadingLibrary skill="listening-reading" />);

    const heading = await screen.findByRole("heading", {
      name: "ETS 2026 Test 01",
    });
    const card = heading.closest("article") as HTMLElement;
    expect(within(card).getByText("Attempted 2 times")).toBeInTheDocument();
    expect(within(card).getByText("Best: 855 / 990")).toBeInTheDocument();
    expect(screen.getByTestId("attempt-history-section")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Listening Practice" }),
    ).toHaveAttribute("href", "/listening/practice/1");
    expect(
      screen.getByRole("link", { name: "Reading Practice" }),
    ).toHaveAttribute("href", "/reading/practice/5");
  });

  it("still renders the L&R exam catalog when history returns 401", async () => {
    vi.mocked(getLrCatalog).mockResolvedValueOnce([sampleExam]);
    vi.mocked(getLrAttemptHistory).mockRejectedValueOnce(
      new LrApiError(401, "Unauthorized"),
    );

    render(<ListeningReadingLibrary skill="reading" />);

    expect(
      await screen.findByRole("heading", { name: "ETS 2026 Test 01" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("attempt-history-section")).toBeInTheDocument();
  });

  it("starts loading immediately on mount and renders catalog items on success", async () => {
    let resolveCatalog!: (items: LrExamCatalogItemApi[]) => void;
    vi.mocked(getLrCatalog).mockImplementation(
      () =>
        new Promise<LrExamCatalogItemApi[]>((resolve) => {
          resolveCatalog = resolve;
        }),
    );

    render(<ListeningReadingLibrary skill="listening-reading" />);

    expect(
      screen.getByText("Loading Listening & Reading tests..."),
    ).toBeInTheDocument();
    expect(getLrCatalog).toHaveBeenCalledTimes(1);
    expect(vi.mocked(getLrCatalog).mock.calls[0]?.[0]).toBeInstanceOf(
      AbortSignal,
    );

    resolveCatalog([sampleExam]);

    expect(await screen.findByText("ETS 2026 Test 01")).toBeInTheDocument();
    expect(
      screen.queryByText("Loading Listening & Reading tests..."),
    ).not.toBeInTheDocument();
  });

  it("renders error state on failure and recovers with a fresh AbortSignal when retried", async () => {
    let resolveRetry!: (items: LrExamCatalogItemApi[]) => void;
    vi.mocked(getLrCatalog)
      .mockRejectedValueOnce(new Error("Unable to connect to the server."))
      .mockImplementationOnce(
        () =>
          new Promise<LrExamCatalogItemApi[]>((resolve) => {
            resolveRetry = resolve;
          }),
      );

    render(<ListeningReadingLibrary skill="reading" />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unable to connect to the server.");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Loading Reading tests...")).toBeInTheDocument();
    expect(getLrCatalog).toHaveBeenCalledTimes(2);
    expect(vi.mocked(getLrCatalog).mock.calls[1]?.[0]).toBeInstanceOf(
      AbortSignal,
    );

    resolveRetry([sampleExam]);

    expect(await screen.findByText("ETS 2026 Test 01")).toBeInTheDocument();
  });

  it("aborts the in-flight catalog request on unmount", async () => {
    let resolveCatalog!: (items: LrExamCatalogItemApi[]) => void;
    vi.mocked(getLrCatalog).mockImplementation(
      () =>
        new Promise<LrExamCatalogItemApi[]>((resolve) => {
          resolveCatalog = resolve;
        }),
    );

    const { unmount } = render(<ListeningReadingLibrary skill="listening" />);
    const signal = vi.mocked(getLrCatalog).mock.calls[0]?.[0];
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
    resolveCatalog([sampleExam]);
    await waitFor(() => {
      expect(getLrCatalog).toHaveBeenCalledTimes(1);
    });
  });
});

describe("ListeningReadingPractice", () => {
  it("retries with a fresh AbortSignal and aborts in-flight retry on unmount", async () => {
    let resolveRetry!: (page: LrPracticeItemPageApi) => void;
    vi.mocked(getLrPracticeItems)
      .mockRejectedValueOnce(new Error("Failed to load practice items."))
      .mockImplementationOnce(
        () =>
          new Promise<LrPracticeItemPageApi>((resolve) => {
            resolveRetry = resolve;
          }),
      );

    const { unmount } = render(
      <ListeningReadingPractice part="1" skill="listening" />,
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Failed to load practice items.");
    const firstSignal = vi.mocked(getLrPracticeItems).mock.calls[0]?.[3];
    expect(firstSignal).toBeInstanceOf(AbortSignal);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(getLrPracticeItems).toHaveBeenCalledTimes(2);
    const retrySignal = vi.mocked(getLrPracticeItems).mock.calls[1]?.[3];
    expect(retrySignal).toBeInstanceOf(AbortSignal);
    expect(retrySignal).not.toBe(firstSignal);
    expect(retrySignal?.aborted).toBe(false);

    unmount();
    expect(retrySignal?.aborted).toBe(true);
    resolveRetry(samplePracticePage);
  });

  it("renders practice items and Listening/Reading skillLinks", async () => {
    vi.mocked(getLrPracticeItems).mockResolvedValueOnce(samplePracticePage);

    render(<ListeningReadingPractice part="1" skill="listening" />);

    expect(await screen.findByText("Airport check-in")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Listening" })).toHaveAttribute(
      "href",
      "/listening/practice/1",
    );
    expect(screen.getByRole("link", { name: "Reading" })).toHaveAttribute(
      "href",
      "/reading/practice/5",
    );
  });
});
