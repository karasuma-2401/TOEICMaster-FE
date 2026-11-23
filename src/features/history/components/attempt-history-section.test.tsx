// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchUnifiedHistory, type UnifiedAttemptItem } from "../api";
import { AttemptHistorySection } from "./attempt-history-section";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

    render(<AttemptHistorySection skills={["lr"]} title="L&R History" />);

    expect(
      await screen.findByText("Sign in to view your attempt history"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute(
      "href",
      "/login?next=%2Fhistory",
    );
  });
});
