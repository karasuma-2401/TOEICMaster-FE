// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLrCatalog } from "@/features/lr-exam/api";
import { getSpeakingTests } from "@/features/speaking/api";
import { getWritingTests } from "@/features/writing/attempt-api";
import { FeaturedExams } from "./featured-exams";

vi.mock("@/features/lr-exam/api", () => ({ getLrCatalog: vi.fn() }));
vi.mock("@/features/speaking/api", () => ({ getSpeakingTests: vi.fn() }));
vi.mock("@/features/writing/attempt-api", () => ({ getWritingTests: vi.fn() }));
afterEach(cleanup);

const lrTest = (id: string, day: number) => ({
  examId: id,
  code: id,
  title: `Test ${id}`,
  versionNumber: 1,
  totalQuestions: 200,
  listeningQuestions: 100,
  readingQuestions: 100,
  durationMinutes: 120,
  minScaledScore: 10,
  maxScaledScore: 990,
  publishedAtUtc: `2026-01-${String(day).padStart(2, "0")}T00:00:00Z`,
  activeAttemptId: null,
});

const test = (id: string, day: number) => ({
  id,
  code: id,
  title: `Test ${id}`,
  description: "",
  publishedAtUtc: `2026-01-${String(day).padStart(2, "0")}T00:00:00Z`,
  parts: [],
});
const page = (items: ReturnType<typeof test>[]) => ({
  items,
  pageNumber: 1,
  pageSize: 4,
  totalCount: items.length,
  totalPages: 1,
});
const titles = () =>
  screen.getAllByRole("heading").map((heading) => heading.textContent);

describe("FeaturedExams", () => {
  it("shows the four newest tests across L&R, Speaking, and Writing, newest first", async () => {
    vi.mocked(getLrCatalog).mockResolvedValue([lrTest("lr1", 6)]);
    vi.mocked(getSpeakingTests).mockResolvedValue([
      test("s1", 1),
      test("s2", 5),
      test("s3", 3),
    ]);
    vi.mocked(getWritingTests).mockResolvedValue(
      page([test("w1", 4), test("w2", 2)]) as never,
    );
    render(<FeaturedExams />);
    await screen.findByText("Test lr1");
    expect(titles()).toEqual(["Test lr1", "Test s2", "Test w1", "Test s3"]);
    expect(screen.getByText("Newest")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Start Test" })[0],
    ).toHaveAttribute("href", "/exams/lr/lr1");
    expect(
      screen.getAllByRole("link", { name: "Start Test" })[2],
    ).toHaveAttribute("href", "/writing/tests/w1?mode=full");
  });

  it("still shows one skill when L&R returns 401 and Speaking fails", async () => {
    vi.mocked(getLrCatalog).mockRejectedValue(new Error("401"));
    vi.mocked(getSpeakingTests).mockRejectedValue(new Error("down"));
    vi.mocked(getWritingTests).mockResolvedValue(
      page([test("w1", 4)]) as never,
    );
    render(<FeaturedExams />);
    expect(await screen.findByText("Test w1")).toBeInTheDocument();
  });

  it("explains when nothing is published", async () => {
    vi.mocked(getLrCatalog).mockResolvedValue([]);
    vi.mocked(getSpeakingTests).mockResolvedValue([]);
    vi.mocked(getWritingTests).mockResolvedValue(page([]) as never);
    render(<FeaturedExams />);
    expect(
      await screen.findByText("No tests published yet"),
    ).toBeInTheDocument();
  });
});
