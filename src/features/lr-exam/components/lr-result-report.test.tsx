// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LrResultReport } from "../types";
import { LrResultReportView } from "./lr-result-report";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("./exam-ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./exam-ui")>();
  return { ...actual, LearnerNav: () => <nav aria-label="Mock nav" /> };
});

afterEach(cleanup);

const report: LrResultReport = {
  examTitle: "Kết quả bài thi Listening & Reading - ETS 2024 Test 01",
  examIdentity: "ETS-2024-01",
  takenAt: "19/11/2026",
  durationLabel: "112 phút 45 giây",
  scale: "ETS Standard",
  totalScore: 855,
  maxScore: 990,
  listening: { score: 445, max: 495 },
  reading: { score: 410, max: 495 },
  listeningRaw: { correct: 89, total: 100 },
  readingRaw: { correct: 83, total: 100 },
  targetScore: 800,
  parts: [
    { part: 1, correct: 6, total: 6 },
    { part: 2, correct: 23, total: 25 },
    { part: 3, correct: 34, total: 39 },
    { part: 4, correct: 26, total: 30 },
    { part: 5, correct: 27, total: 30 },
    { part: 6, correct: 13, total: 16 },
    { part: 7, correct: 43, total: 54 },
  ],
};

describe("LrResultReportView", () => {
  it("renders Screen 18 3-card hero scores, raw counts, 7-part performance bars, and history action", () => {
    render(
      <LrResultReportView
        examHref="/exams/lr/exam-1"
        report={report}
        reviewHref="/exams/lr/attempts/a1/review"
      />,
    );

    expect(screen.getByText("855")).toBeInTheDocument();
    expect(screen.getByText(/89 \/ 100 câu đúng/)).toBeInTheDocument();
    expect(screen.getByText(/83 \/ 100 câu đúng/)).toBeInTheDocument();
    expect(
      screen.getByText(/Đạt mục tiêu đề ra \(Mục tiêu 800\)/),
    ).toBeInTheDocument();
    expect(screen.getByText("LISTENING SECTION (100 CÂU)")).toBeInTheDocument();
    expect(screen.getByText("READING SECTION (100 CÂU)")).toBeInTheDocument();
    expect(screen.getAllByText("Xuất sắc").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Về lịch sử làm bài" }),
    ).toHaveAttribute("href", "/history");
  });
});
