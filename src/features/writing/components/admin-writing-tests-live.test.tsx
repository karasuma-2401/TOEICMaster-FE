// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { AdminWritingTestsLive } from "./admin-writing-tests-live";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  getTest: vi.fn(),
  getExercise: vi.fn(),
  deleteTest: vi.fn(),
  archiveTest: vi.fn(),
  restoreTest: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
vi.mock("@/features/admin/components/content/admin-page-header", () => ({
  AdminPageHeader: ({
    title,
    actions,
  }: {
    title: string;
    actions: ReactNode;
  }) => (
    <header>
      {title}
      {actions}
    </header>
  ),
  AdminNotice: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));
vi.mock("@/features/admin/components/content/content-tabs", () => ({
  ContentTabs: () => null,
}));
vi.mock("@/features/writing/admin-api", () => ({
  listWritingTests: mocks.list,
  getWritingTest: mocks.getTest,
  getWritingExercise: mocks.getExercise,
  createWritingTest: vi.fn(),
  updateWritingTest: vi.fn(),
  publishWritingTest: vi.fn(),
  uploadWritingImage: vi.fn(),
  importWritingTestFile: vi.fn(),
  deleteWritingTestDraft: mocks.deleteTest,
  archiveWritingTest: mocks.archiveTest,
  restoreWritingTest: mocks.restoreTest,
}));

it("loads a legacy draft question into the independent editor without saving it automatically", async () => {
  const draft = {
    id: "test-1",
    code: "WT-1",
    title: "Writing test",
    description: "",
    status: "DRAFT",
    version: 1,
    questions: [
      {
        id: "question-1",
        part: 3,
        sequenceNumber: 1,
        exerciseId: "exercise-1",
        snapshotJson: null,
      },
    ],
  };
  mocks.list.mockResolvedValue({ items: [draft], totalPages: 1 });
  mocks.getTest.mockResolvedValue(draft);
  mocks.getExercise.mockResolvedValue({
    id: "exercise-1",
    part: 3,
    prompt: "A legacy essay prompt",
    minimumWordCount: 300,
    rubricNotes: "Rubric",
    modelAnswer: "Internal reference",
  });

  render(<AdminWritingTestsLive />);
  fireEvent.click(await screen.findByRole("button", { name: "Chỉnh sửa" }));

  await waitFor(() =>
    expect(mocks.getExercise).toHaveBeenCalledWith("exercise-1"),
  );
  expect(
    await screen.findByDisplayValue("A legacy essay prompt"),
  ).toBeInTheDocument();
  expect(screen.getByDisplayValue("Internal reference")).toBeInTheDocument();
});

it.each([
  {
    status: "DRAFT",
    button: "Xóa",
    method: mocks.deleteTest,
    message: "Đã xóa đề nháp.",
  },
  {
    status: "PUBLISHED",
    button: "Lưu trữ",
    method: mocks.archiveTest,
    message: "Đã lưu trữ đề Writing.",
  },
  {
    status: "ARCHIVED",
    button: "Khôi phục",
    method: mocks.restoreTest,
    message: "Đã khôi phục đề Writing.",
  },
])(
  "confirms $button and sends the current version",
  async ({ status, button, method, message }) => {
    const test = {
      id: "test-1",
      code: "WT-1",
      title: "Test",
      status,
      version: 4,
      questions: [],
    };
    mocks.list.mockResolvedValue({ items: [test], totalPages: 1 });
    method.mockResolvedValue(undefined);
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(<AdminWritingTestsLive />);
    const action = await screen.findByRole(
      "button",
      { name: button },
      { timeout: 10000 },
    );
    fireEvent.click(action);
    expect(method).not.toHaveBeenCalled();
    fireEvent.click(action);
    await waitFor(() => expect(method).toHaveBeenCalledWith("test-1", 4));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(confirm).toHaveBeenCalledTimes(2);
  },
);

it("shows an error instead of reporting success when a lifecycle operation fails", async () => {
  mocks.list.mockResolvedValue({
    items: [
      {
        id: "test-1",
        code: "WT-1",
        title: "Test",
        status: "PUBLISHED",
        version: 2,
        questions: [],
      },
    ],
    totalPages: 1,
  });
  mocks.archiveTest.mockRejectedValue(
    new Error("Đề đã thay đổi. Hãy tải lại."),
  );
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<AdminWritingTestsLive />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Lưu trữ" }, { timeout: 10000 }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Đề đã thay đổi");
  expect(screen.queryByText("Đã lưu trữ đề Writing.")).not.toBeInTheDocument();
});

it("opens a published test with its frozen content and without editing actions", async () => {
  const published = {
    id: "test-2",
    code: "WT-2",
    title: "Published test",
    description: "Description",
    status: "PUBLISHED",
    version: 2,
    questions: [
      {
        id: "q1",
        part: 1,
        sequenceNumber: 1,
        exerciseId: "legacy-exercise",
        snapshotJson: JSON.stringify({
          ImageAssetId: "image-1",
          ImageAlt: "Office scene",
          KeywordOne: "desk",
          KeywordTwo: "work",
          ModelAnswer: "Internal only",
        }),
      },
      {
        id: "q2",
        part: 2,
        sequenceNumber: 1,
        exerciseId: null,
        snapshotJson: JSON.stringify({
          Sender: "Sam",
          Recipient: "Pat",
          Subject: "Meeting",
          EmailBody: "Please join us.",
          Directions: "Suggest a time.",
        }),
      },
    ],
  };
  mocks.list.mockResolvedValue({ items: [published], totalPages: 1 });
  mocks.getTest.mockResolvedValue(published);

  render(<AdminWritingTestsLive />);
  fireEvent.click(await screen.findByRole("button", { name: "Xem" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Chi tiết đề Writing",
  });
  expect(
    within(dialog).getByRole("img", { name: "Office scene" }),
  ).toHaveAttribute("src", "/api/admin/writing/media/image-1");
  expect(within(dialog).getByText("Suggest a time.")).toBeInTheDocument();
  expect(within(dialog).queryByText("Internal only")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Chỉnh sửa" }),
  ).not.toBeInTheDocument();
  expect(mocks.getExercise).not.toHaveBeenCalled();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Đóng chi tiết đề" }),
  );
  expect(
    screen.queryByRole("dialog", { name: "Chi tiết đề Writing" }),
  ).not.toBeInTheDocument();
});
