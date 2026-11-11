// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AdminWritingContentPage } from "./admin-writing-pages";

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/features/writing/admin-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/writing/admin-api")>()),
  listWritingExercises: mocks.list,
}));
vi.mock("@/features/admin/components/content/content-tabs", () => ({
  ContentTabs: () => null,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shows the actual image and keywords when previewing a Part 1 exercise", async () => {
  mocks.list.mockResolvedValue({
    items: [
      {
        id: "exercise-1",
        part: 1,
        code: "WP1-01",
        topic: "Office",
        difficulty: "EASY",
        status: "PUBLISHED",
        imageAssetId: "asset-1",
        imageAlt: "A person at a desk",
        keywordOne: "person",
        keywordTwo: "desk",
        version: 1,
        updatedAtUtc: "2026-01-01T00:00:00Z",
      },
    ],
    totalCount: 1,
  });
  render(<AdminWritingContentPage />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Xem" }, { timeout: 10000 }),
  );
  const dialog = screen.getByRole("dialog", { name: "Preview bài tập" });
  expect(
    within(dialog).getByRole("img", { name: "A person at a desk" }),
  ).toHaveAttribute("src", "/api/admin/writing/media/asset-1");
  expect(within(dialog).getByText("person")).toBeInTheDocument();
  expect(within(dialog).getByText("desk")).toBeInTheDocument();
  expect(within(dialog).queryByText("asset-1")).not.toBeInTheDocument();
});

it("locks a dedicated workspace to its route Part", async () => {
  mocks.list.mockResolvedValue({ items: [], totalCount: 0 });

  render(<AdminWritingContentPage part={2} />);

  await screen.findByText("Không tìm thấy bài tập phù hợp");
  expect(mocks.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ part: 2 }),
    expect.any(AbortSignal),
  );
  expect(
    screen.queryByRole("button", { name: /Part 1/i }),
  ).not.toBeInTheDocument();
});
