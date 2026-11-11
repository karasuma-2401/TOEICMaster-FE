// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpeakingTests } from "@/features/speaking/api";
import { getWritingTests } from "@/features/writing/attempt-api";
import { FeaturedExams } from "./featured-exams";

vi.mock("@/features/speaking/api", () => ({ getSpeakingTests: vi.fn() }));
vi.mock("@/features/writing/attempt-api", () => ({ getWritingTests: vi.fn() }));
afterEach(cleanup);

const test = (id: string, day: number) => ({
  id,
  code: id,
  title: `Đề ${id}`,
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
  it("shows the four newest tests across skills, newest first", async () => {
    vi.mocked(getSpeakingTests).mockResolvedValue([
      test("s1", 1),
      test("s2", 5),
      test("s3", 3),
    ]);
    vi.mocked(getWritingTests).mockResolvedValue(
      page([test("w1", 4), test("w2", 2)]) as never,
    );
    render(<FeaturedExams />);
    await screen.findByText("Đề s2");
    expect(titles()).toEqual(["Đề s2", "Đề w1", "Đề s3", "Đề w2"]);
    expect(screen.getByText("Mới nhất")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Làm bài ngay" })[1],
    ).toHaveAttribute("href", "/writing/tests/w1?mode=full");
  });

  it("still shows one skill when the other fails", async () => {
    vi.mocked(getSpeakingTests).mockRejectedValue(new Error("down"));
    vi.mocked(getWritingTests).mockResolvedValue(
      page([test("w1", 4)]) as never,
    );
    render(<FeaturedExams />);
    expect(await screen.findByText("Đề w1")).toBeInTheDocument();
  });

  it("explains when nothing is published", async () => {
    vi.mocked(getSpeakingTests).mockResolvedValue([]);
    vi.mocked(getWritingTests).mockResolvedValue(page([]) as never);
    render(<FeaturedExams />);
    expect(
      await screen.findByText("Chưa có đề thi được công bố"),
    ).toBeInTheDocument();
  });
});
