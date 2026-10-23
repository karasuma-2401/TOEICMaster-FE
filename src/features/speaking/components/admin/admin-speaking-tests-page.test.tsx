// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSpeakingAdminSummary,
  getSpeakingTestDetail,
  listSpeakingExercises,
  listSpeakingTests,
  publishSpeakingTest,
  updateSpeakingTest,
} from "@/features/speaking/admin-api";
import {
  parseExercise,
  parseTestDetail,
  parseTestListItem,
} from "@/features/speaking/parsers";
import {
  exerciseDto,
  pageDto,
  summaryDto,
  testDetailDto,
  testListItemDto,
} from "@/features/speaking/testing/fixtures";
import { AdminSpeakingTestsPage } from "./admin-speaking-tests-page";

vi.mock("@/features/speaking/admin-api", () => ({
  createSpeakingTest: vi.fn(),
  getSpeakingAdminSummary: vi.fn(),
  getSpeakingTestDetail: vi.fn(),
  listSpeakingExercises: vi.fn(),
  listSpeakingTests: vi.fn(),
  publishSpeakingTest: vi.fn(),
  updateSpeakingTest: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getSpeakingAdminSummary).mockResolvedValue(summaryDto);
  vi.mocked(listSpeakingTests).mockResolvedValue(
    pageDto([
      parseTestListItem(
        testListItemDto({ title: "Practice Test 03", status: "DRAFT" }),
      ),
    ]),
  );
  vi.mocked(listSpeakingExercises).mockResolvedValue(
    pageDto(
      [1, 2, 3, 4, 5].map((part) => parseExercise(exerciseDto(part as 1))),
    ),
  );
  vi.mocked(getSpeakingTestDetail).mockResolvedValue(
    parseTestDetail(testDetailDto()),
  );
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminSpeakingTestsPage", () => {
  it("passes the status filter to the backend", async () => {
    render(<AdminSpeakingTestsPage />);
    await screen.findByText("Practice Test 03");

    fireEvent.change(screen.getByLabelText("Lọc trạng thái đề"), {
      target: { value: "DRAFT" },
    });

    await vi.waitFor(() =>
      expect(listSpeakingTests).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "DRAFT", pageNumber: 1 }),
        expect.any(AbortSignal),
      ),
    );
  });

  it("loads the test into the workspace and blocks publishing an incomplete test", async () => {
    render(<AdminSpeakingTestsPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Practice Test 03" }),
    );
    const workspace = screen.getByRole("dialog", {
      name: "Test builder Speaking",
    });

    expect(
      await within(workspace).findByDisplayValue("SPK-2026-03"),
    ).toBeInTheDocument();
    fireEvent.click(
      within(workspace).getByRole("button", { name: "Xuất bản đề" }),
    );

    expect(within(workspace).getByRole("alert")).toHaveTextContent(
      "Hoàn thành mọi điều kiện xuất bản trước khi công bố.",
    );
    expect(updateSpeakingTest).not.toHaveBeenCalled();
    expect(publishSpeakingTest).not.toHaveBeenCalled();
  });
});
