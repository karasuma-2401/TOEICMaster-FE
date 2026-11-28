// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSession } from "@/features/auth/api";
import { refreshSessionLocked } from "@/shared/api/http";
import { fetchUnifiedHistory, type UnifiedAttemptItem } from "../api";
import { AttemptHistorySection } from "./attempt-history-section";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/auth/api", () => ({
  getSession: vi.fn(),
}));
vi.mock("@/shared/api/http", () => ({
  refreshSessionLocked: vi.fn(),
}));
vi.mock("@/features/history/api", () => ({
  fetchUnifiedHistory: vi.fn(),
}));

const sampleItems: UnifiedAttemptItem[] = [
  {
    id: "lr-1",
    skill: "lr",
    examId: "exam-1",
    code: "ETS-2026-01",
    title: "ETS 2026 Test 01",
    modeLabel: "Full Listening & Reading",
    status: "COMPLETED",
    score: 855,
    maxScore: 990,
    subScoreLabel: "L 445 · R 410",
    evaluationStatus: null,
    timestampUtc: "2026-11-18T10:00:00Z",
    durationSeconds: 6800,
    resultHref: "/exams/lr/attempts/lr-1/result",
    reviewHref: "/exams/lr/attempts/lr-1/review",
    resumeHref: null,
  },
  {
    id: "sp-1",
    skill: "speaking",
    examId: "sp-test-1",
    code: "SP-01",
    title: "Speaking Test 01",
    modeLabel: "Full Speaking Test",
    status: "IN_PROGRESS",
    score: null,
    maxScore: 200,
    subScoreLabel: null,
    evaluationStatus: null,
    timestampUtc: "2026-11-17T10:00:00Z",
    durationSeconds: null,
    resultHref: null,
    reviewHref: null,
    resumeHref: "/speaking/attempts/sp-1",
  },
  {
    id: "wr-1",
    skill: "writing",
    examId: "wr-test-1",
    code: "WR-01",
    title: "Writing Test 01",
    modeLabel: "Full Writing Test",
    status: "COMPLETED",
    score: 160,
    maxScore: 200,
    subScoreLabel: null,
    evaluationStatus: "COMPLETED",
    timestampUtc: "2026-11-16T10:00:00Z",
    durationSeconds: null,
    resultHref: "/writing/attempts/wr-1/result",
    reviewHref: "/writing/attempts/wr-1/review",
    resumeHref: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    status: "authenticated",
    user: { id: "u1", displayName: "Learner", email: "learner@example.com" },
  });
  vi.mocked(refreshSessionLocked).mockResolvedValue();
});
afterEach(cleanup);

describe("AttemptHistorySection", () => {
  it("renders cross-skill attempt cards, supports filtering and Show more expansion", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchUnifiedHistory).mockResolvedValueOnce({
      items: sampleItems,
      unauthenticatedSkills: [],
    });

    render(
      <AttemptHistorySection
        limit={2}
        showFilter
        showSummary
        showViewAll
        skills={["lr", "speaking", "writing"]}
        title="Attempt History"
      />,
    );

    const section = screen.getByTestId("attempt-history-section");
    expect(section).toBeInTheDocument();

    expect(await screen.findByText("ETS 2026 Test 01")).toBeInTheDocument();
    expect(
      screen.queryByTestId("score-progression-chart"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Speaking Test 01")).toBeInTheDocument();
    expect(screen.queryByText("Writing Test 01")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show more (1)" }));
    expect(screen.getByText("Writing Test 01")).toBeInTheDocument();

    const filterGroup = screen.getByRole("group", {
      name: "Filter history by skill",
    });
    await user.click(within(filterGroup).getByRole("button", { name: "L&R" }));

    expect(screen.getByText("ETS 2026 Test 01")).toBeInTheDocument();
    expect(screen.queryByText("Speaking Test 01")).not.toBeInTheDocument();
    expect(screen.queryByText("Writing Test 01")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Results" })).toHaveAttribute(
      "href",
      "/exams/lr/attempts/lr-1/result",
    );
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      "/exams/lr/attempts/lr-1/review",
    );
  });

  it("renders a guest sign-in prompt when all requested skills return 401", async () => {
    vi.mocked(fetchUnifiedHistory).mockResolvedValueOnce({
      items: [],
      unauthenticatedSkills: ["lr"],
    });

    render(
      <AttemptHistorySection showChart skills={["lr"]} title="L&R History" />,
    );

    expect(
      await screen.findByText("Sign in to view your attempt history"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute(
      "href",
      "/login?next=%2Fhistory",
    );
    expect(
      screen.queryByTestId("score-progression-chart"),
    ).not.toBeInTheDocument();
  });

  it("does not show the enabled chart while loading or on failure", async () => {
    vi.mocked(fetchUnifiedHistory).mockRejectedValueOnce(
      new Error("History unavailable"),
    );
    render(<AttemptHistorySection showChart />);

    expect(screen.getByText("Loading attempt history…")).toBeInTheDocument();
    expect(
      screen.queryByTestId("score-progression-chart"),
    ).not.toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "History unavailable",
    );
    expect(
      screen.queryByTestId("score-progression-chart"),
    ).not.toBeInTheDocument();
  });

  it("opts in above the cards and synchronizes chart tabs with specific filters only", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchUnifiedHistory).mockResolvedValueOnce({
      items: [
        ...sampleItems,
        { ...sampleItems[2], id: "wr-2", title: "Writing Test 02", score: 175 },
      ],
      unauthenticatedSkills: [],
    });
    render(<AttemptHistorySection showChart showFilter />);

    const chart = await screen.findByRole(
      "region",
      { name: "Score progression" },
      { timeout: 5000 },
    );
    const firstCard = screen.getAllByRole("article")[0];
    expect(
      chart.compareDocumentPosition(firstCard) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const filters = within(
      screen.getByRole("group", { name: "Filter history by skill" }),
    );
    const chartTabs = within(chart);
    const all = filters.getByRole("button", { name: "All" });
    const speakingTab = chartTabs.getByRole("tab", {
      name: "Speaking (0-200)",
    });
    const writingTab = chartTabs.getByRole("tab", { name: "Writing (0-200)" });
    expect(writingTab).toHaveAttribute("aria-selected", "true");

    await user.click(speakingTab);
    expect(speakingTab).toHaveAttribute("aria-selected", "true");
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("article")).toHaveLength(4);

    await user.click(filters.getByRole("button", { name: "L&R" }));
    expect(chartTabs.getByRole("tab", { name: "L&R (0-990)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);

    await user.click(writingTab);
    expect(filters.getByRole("button", { name: "Writing" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Writing Test 02" }),
    ).toBeVisible();
    expect(fetchUnifiedHistory).toHaveBeenCalledTimes(1);
  }, 15_000);

  it("renders the sign-in prompt immediately on first render when isAuthenticated is false", () => {
    render(
      <AttemptHistorySection
        isAuthenticated={false}
        title="Recent Attempt History"
      />,
    );

    expect(
      screen.getByText("Sign in to view your attempt history"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No attempts yet")).not.toBeInTheDocument();
    expect(fetchUnifiedHistory).not.toHaveBeenCalled();
  });

  it("renders guest sign-in prompt with zero history fetches when session is guest", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ status: "guest" });

    render(
      <AttemptHistorySection
        skills={["lr", "speaking", "writing"]}
        title="Recent Attempt History"
      />,
    );

    expect(
      await screen.findByText("Sign in to view your attempt history"),
    ).toBeInTheDocument();
    expect(fetchUnifiedHistory).not.toHaveBeenCalled();
    expect(refreshSessionLocked).not.toHaveBeenCalled();
  });

  it("refreshes once before fetching history when session is refresh_required", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      status: "refresh_required",
    });
    vi.mocked(fetchUnifiedHistory).mockResolvedValueOnce({
      items: sampleItems,
      unauthenticatedSkills: [],
    });

    render(<AttemptHistorySection skills={["lr"]} title="L&R History" />);

    expect(await screen.findByText("ETS 2026 Test 01")).toBeInTheDocument();
    expect(refreshSessionLocked).toHaveBeenCalledTimes(1);
    expect(fetchUnifiedHistory).toHaveBeenCalledTimes(1);
  });
});
