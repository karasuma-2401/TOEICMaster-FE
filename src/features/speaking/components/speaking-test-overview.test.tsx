// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getSpeakingTest } from "@/features/speaking/api";
import { SpeakingApiError } from "@/features/speaking/http";
import { ids, testSummaryDto } from "@/features/speaking/testing/fixtures";
import { SpeakingTestOverview } from "./speaking-test-overview";

vi.mock("./speaking-header", () => ({
  SpeakingHeader: () => <header>Speaking header</header>,
}));
vi.mock("@/features/speaking/api", () => ({ getSpeakingTest: vi.fn() }));

describe("SpeakingTestOverview", () => {
  it("shows only the selected Part and links to its practice session", async () => {
    vi.mocked(getSpeakingTest).mockResolvedValue(
      testSummaryDto() as Awaited<ReturnType<typeof getSpeakingTest>>,
    );
    render(<SpeakingTestOverview mode="part-4" testId={ids.test} />);

    expect(await screen.findByText("LUYỆN THEO PART")).toBeInTheDocument();
    expect(screen.getByText("3 câu")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Speaking Part 4 · Trả lời theo thông tin",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Speaking Part 5/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Bắt đầu làm bài" }),
    ).toHaveAttribute(
      "href",
      `/speaking/tests/${ids.test}/practice?mode=part-4`,
    );
  });

  it("shows the backend error when the test cannot be loaded", async () => {
    vi.mocked(getSpeakingTest).mockRejectedValue(
      new SpeakingApiError(404, "Không tìm thấy đề Speaking đã công bố."),
    );
    render(<SpeakingTestOverview testId={ids.test} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không tìm thấy đề Speaking đã công bố.",
    );
  });
});
