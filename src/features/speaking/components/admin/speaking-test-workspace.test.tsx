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
  cloneSpeakingTest,
  getSpeakingTestDetail,
  listSpeakingExercises,
  updateSpeakingTest,
} from "@/features/speaking/admin-api";
import { SpeakingApiError } from "@/features/speaking/http";
import { parseExercise, parseTestDetail } from "@/features/speaking/parsers";
import {
  exerciseDto,
  pageDto,
  testDetailDto,
} from "@/features/speaking/testing/fixtures";
import { SpeakingTestWorkspace } from "./speaking-test-workspace";

vi.mock("@/features/speaking/admin-api", () => ({
  createSpeakingTest: vi.fn(),
  cloneSpeakingTest: vi.fn(),
  deleteSpeakingTest: vi.fn(),
  getSpeakingTestDetail: vi.fn(),
  listSpeakingExercises: vi.fn(),
  publishSpeakingTest: vi.fn(),
  updateSpeakingTest: vi.fn(),
}));
const first = parseExercise(exerciseDto(1, { id: "first", code: "SP1-FIRST" }));
const second = parseExercise(
  exerciseDto(1, { id: "second", code: "SP1-SECOND" }),
);
const fixture = (overrides = {}) =>
  parseTestDetail(
    testDetailDto({
      exercises: [
        {
          part: 1,
          sequenceNumber: 2,
          exerciseId: second.id,
          exercise: exerciseDto(1, { id: second.id, code: second.code }),
        },
      ],
      ...overrides,
    }),
  );
beforeEach(() => {
  vi.mocked(getSpeakingTestDetail).mockResolvedValue(fixture());
  vi.mocked(updateSpeakingTest).mockResolvedValue(fixture({ version: 3 }));
  vi.mocked(listSpeakingExercises).mockResolvedValue(pageDto([first, second]));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const open = async () => {
  const callbacks = { onClose: vi.fn(), onSaved: vi.fn() };
  render(<SpeakingTestWorkspace testId="source" {...callbacks} />);
  await screen.findByDisplayValue("SPK-2026-03");
  return callbacks;
};

describe("SpeakingTestWorkspace", () => {
  it("keeps slot two, leaves the workspace open after save, and uses the new version", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));
    await vi.waitFor(() => expect(updateSpeakingTest).toHaveBeenCalledOnce());
    expect(
      vi.mocked(updateSpeakingTest).mock.calls[0][2].exerciseIds?.[1][1],
    ).toBe(second.id);
    expect(
      vi.mocked(updateSpeakingTest).mock.calls[0][2].exerciseIds?.[1][0],
    ).toBeUndefined();
    await vi.waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Lưu bản nháp" }),
      ).toBeEnabled(),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));
    await vi.waitFor(() =>
      expect(updateSpeakingTest).toHaveBeenLastCalledWith(
        expect.any(String),
        3,
        expect.any(Object),
      ),
    );
  });

  it("searches on the server and disables the exercise already assigned to Q2", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Chọn bài cho Q1" }));
    const picker = screen.getByRole("region", { name: "Chọn bài Part 1" });
    expect(
      await within(picker).findByRole("button", { name: "Chọn SP1-SECOND" }),
    ).toBeDisabled();
    expect(within(picker).getByText(/Đang dùng ở Q2/)).toBeVisible();
    fireEvent.change(
      within(picker).getByLabelText("Tìm mã hoặc chủ đề bài tập"),
      { target: { value: "oldest" } },
    );
    await vi.waitFor(() =>
      expect(listSpeakingExercises).toHaveBeenLastCalledWith(
        expect.objectContaining({
          query: "oldest",
          pageSize: 20,
          status: "PUBLISHED",
        }),
        expect.any(AbortSignal),
      ),
    );
  });

  it("shows every validation error and keeps local edits during a version conflict", async () => {
    await open();
    vi.mocked(updateSpeakingTest).mockRejectedValueOnce(
      new SpeakingApiError(422, "Lỗi", {
        content: ["Câu 1 và Câu 2 trùng", "Câu 5 và Câu 8 trùng"],
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Chưa lưu được");
    expect(alert).toHaveTextContent("Câu 1 và Câu 2 trùng");
    expect(alert).toHaveTextContent("Câu 5 và Câu 8 trùng");
    vi.mocked(updateSpeakingTest).mockRejectedValueOnce(
      new SpeakingApiError(409, "Phiên bản cũ", {}, "VERSION_CONFLICT"),
    );
    fireEvent.change(screen.getByLabelText("Tên đề *"), {
      target: { value: "Local edit" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Tải lại bản mới để so sánh" }),
    );
    expect(await screen.findByDisplayValue("Local edit")).toBeVisible();
  });

  it("asks before discarding edits", async () => {
    const callbacks = await open();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.change(screen.getByLabelText("Tên đề *"), {
      target: { value: "Unsaved" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đóng builder" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });

  it("clones a published test into an editable independent draft", async () => {
    vi.mocked(getSpeakingTestDetail).mockResolvedValue(
      fixture({ status: "PUBLISHED" }),
    );
    vi.mocked(cloneSpeakingTest).mockResolvedValue(
      fixture({
        id: "copy",
        code: "COPY",
        title: "Copied test",
        contentMode: "DIRECT",
        exercises: [],
        questions: [],
        version: 1,
      }),
    );
    await open();
    fireEvent.change(screen.getByLabelText("Mã đề nhân bản"), {
      target: { value: "COPY" },
    });
    fireEvent.change(screen.getByLabelText("Tên đề nhân bản"), {
      target: { value: "Copied test" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Nhân bản thành nháp" }),
    );
    await vi.waitFor(() =>
      expect(screen.getByLabelText("Mã đề *")).toHaveValue("COPY"),
    );
    expect(cloneSpeakingTest).toHaveBeenCalledWith(
      expect.any(String),
      2,
      "COPY",
      "Copied test",
    );
    expect(screen.getByRole("button", { name: "Lưu bản nháp" })).toBeEnabled();
  });
});
