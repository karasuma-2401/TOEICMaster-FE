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
  deleteSpeakingTest,
  getSpeakingAdminSummary,
  getSpeakingTestDetail,
  importSpeakingTest,
  listSpeakingExercises,
  listSpeakingTests,
  publishSpeakingTest,
  updateSpeakingTest,
} from "@/features/speaking/admin-api";
import { SpeakingApiError } from "@/features/speaking/http";
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
  deleteSpeakingTest: vi.fn(),
  getSpeakingAdminSummary: vi.fn(),
  getSpeakingTestDetail: vi.fn(),
  importSpeakingTest: vi.fn(),
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

async function openImport() {
  render(<AdminSpeakingTestsPage />);
  await screen.findByText("Practice Test 03");
  fireEvent.click(screen.getByRole("button", { name: "Import Excel" }));
  return screen.getByRole("dialog", { name: "Import đề Speaking từ Excel" });
}

function chooseFile(dialog: HTMLElement, file: File) {
  fireEvent.change(within(dialog).getByLabelText(/File Excel/), {
    target: { files: [file] },
  });
}

describe("AdminSpeakingTestsPage", () => {
  it("opens a test read-only from the view action", async () => {
    render(<AdminSpeakingTestsPage />);
    fireEvent.click(await screen.findByRole("button", { name: /^Xem SPK/ }));

    const workspace = screen.getByRole("dialog", {
      name: "Test builder Speaking",
    });
    expect(
      await within(workspace).findByDisplayValue("SPK-2026-03"),
    ).toBeDisabled();
    expect(
      within(workspace).queryByRole("button", { name: "Lưu bản nháp" }),
    ).not.toBeInTheDocument();
  });

  it("deletes a draft after confirmation and reloads the list", async () => {
    vi.mocked(deleteSpeakingTest).mockResolvedValue(undefined);
    render(<AdminSpeakingTestsPage />);
    fireEvent.click(await screen.findByRole("button", { name: /^Xóa / }));
    expect(deleteSpeakingTest).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Xóa đề" }));

    await vi.waitFor(() => expect(listSpeakingTests).toHaveBeenCalledTimes(2));
    expect(deleteSpeakingTest).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/^Đã xóa /)).toBeInTheDocument();
  });

  it("suggests matching tests while searching", async () => {
    render(<AdminSpeakingTestsPage />);
    await screen.findByText("Practice Test 03");
    const search = screen.getByLabelText("Tìm đề Speaking");

    fireEvent.focus(search);
    const suggestions = screen.getByRole("list", { name: "Gợi ý tìm kiếm" });
    fireEvent.click(within(suggestions).getByRole("button"));

    expect(search).not.toHaveValue("");
  });

  it("keeps edit and delete locked on published tests", async () => {
    vi.mocked(listSpeakingTests).mockResolvedValue(
      pageDto([
        parseTestListItem(
          testListItemDto({ title: "Live", status: "PUBLISHED" }),
        ),
      ]),
    );
    render(<AdminSpeakingTestsPage />);

    expect(await screen.findByRole("button", { name: /^Sửa / })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Xóa / })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Xem / })).toBeEnabled();
  });

  it("imports a workbook and opens the new draft", async () => {
    const detail = parseTestDetail(testDetailDto());
    vi.mocked(importSpeakingTest).mockResolvedValue(detail);
    const dialog = await openImport();
    const file = new File(["xlsx"], "de.xlsx");

    chooseFile(dialog, file);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Import bản nháp" }),
    );

    expect(
      await screen.findByRole("dialog", { name: "Test builder Speaking" }),
    ).toBeInTheDocument();
    expect(importSpeakingTest).toHaveBeenCalledWith(file);
    await vi.waitFor(() =>
      expect(getSpeakingTestDetail).toHaveBeenCalledWith(
        detail.test.id,
        expect.anything(),
      ),
    );
    expect(
      screen.queryByRole("dialog", { name: "Import đề Speaking từ Excel" }),
    ).not.toBeInTheDocument();
  });

  it("rejects a non-xlsx file without calling the API", async () => {
    const dialog = await openImport();

    chooseFile(dialog, new File(["x"], "de.csv"));

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Chỉ hỗ trợ file Excel .xlsx.",
    );
    expect(
      within(dialog).getByRole("button", { name: "Import bản nháp" }),
    ).toBeDisabled();
    expect(importSpeakingTest).not.toHaveBeenCalled();
  });

  it("lists workbook errors by Excel row", async () => {
    vi.mocked(importSpeakingTest).mockRejectedValue(
      new SpeakingApiError(400, "Validation", {
        "rows[5].Passage": "Cần nhập đoạn văn.",
        exercises: "File cần đúng 7 bài.",
      }),
    );
    const dialog = await openImport();

    chooseFile(dialog, new File(["xlsx"], "de.xlsx"));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Import bản nháp" }),
    );

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("Dòng 5 · Passage: Cần nhập đoạn văn.");
    expect(alert).toHaveTextContent("File cần đúng 7 bài.");
  });

  it("explains a duplicate test code", async () => {
    vi.mocked(importSpeakingTest).mockRejectedValue(
      new SpeakingApiError(409, "Conflict"),
    );
    const dialog = await openImport();

    chooseFile(dialog, new File(["xlsx"], "de.xlsx"));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Import bản nháp" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Mã đề đã tồn tại.",
    );
  });

  it("passes the status filter to the backend", async () => {
    render(<AdminSpeakingTestsPage />);
    await screen.findByText("Practice Test 03");

    fireEvent.click(screen.getByRole("button", { name: /^Lọc trạng thái đề/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bản nháp" }));

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
    expect(
      within(workspace).getByRole("button", { name: "Công bố" }),
    ).toBeDisabled();
    fireEvent.click(
      within(workspace).getByRole("button", { name: "Kiểm tra đề" }),
    );

    expect(within(workspace).getByRole("alert")).toHaveTextContent(
      "Hoàn thành mọi điều kiện xuất bản trước khi công bố.",
    );
    expect(updateSpeakingTest).not.toHaveBeenCalled();
    expect(publishSpeakingTest).not.toHaveBeenCalled();
  });
});
