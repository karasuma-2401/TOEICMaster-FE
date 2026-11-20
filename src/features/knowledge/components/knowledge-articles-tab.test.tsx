// @vitest-environment jsdom
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KnowledgeApiError } from "../http";
import type { KnowledgeArticleSummary, PageResult } from "../types";
import { KnowledgeArticlesTab } from "./knowledge-articles-tab";

const api = vi.hoisted(() => ({
  listKnowledgeArticles: vi.fn(),
  deleteKnowledgeArticle: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../admin-api", () => ({
  listKnowledgeArticles: api.listKnowledgeArticles,
  deleteKnowledgeArticle: api.deleteKnowledgeArticle,
  archiveKnowledgeArticle: vi.fn(),
  publishKnowledgeArticle: vi.fn(),
  unpublishKnowledgeArticle: vi.fn(),
  toAdminBffMediaUrl: vi.fn(),
}));

vi.mock("@/shared/ui/toast", () => ({
  toast: { error: api.toastError, success: api.toastSuccess },
}));

const article: KnowledgeArticleSummary = {
  id: "article-id",
  title: "Draft article",
  slug: "draft-article",
  summary: "Summary",
  skill: "Reading",
  categoryId: "category-id",
  categoryName: "Reading",
  coverImageAssetId: null,
  coverImageUrl: null,
  coverImageAlt: null,
  estimatedReadMinutes: 1,
  status: "Draft",
  publishedAtUtc: null,
  tags: [],
  createdAtUtc: "2026-11-20T00:00:00.000Z",
  updatedAtUtc: "2026-11-20T00:00:00.000Z",
  version: 4,
};

const page: PageResult<KnowledgeArticleSummary> = {
  items: [article],
  pageNumber: 1,
  pageSize: 12,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

beforeEach(() => {
  api.listKnowledgeArticles.mockReset().mockResolvedValue(page);
  api.deleteKnowledgeArticle.mockReset();
  api.toastError.mockReset();
  api.toastSuccess.mockReset();
});

afterEach(cleanup);

async function openDeleteConfirmation() {
  const user = userEvent.setup();
  render(<KnowledgeArticlesTab categories={[]} />);
  await screen.findByText("Draft article");
  await user.click(screen.getByRole("button", { name: "Xóa bài viết" }));
  const dialog = screen.getByRole("dialog", { name: "Xác nhận xóa bài viết" });
  return { dialog, user };
}

describe("KnowledgeArticlesTab destructive confirmation", () => {
  it("prevents duplicate deletion while pending and keeps the dialog open on error", async () => {
    let rejectDelete: (reason: Error) => void = () => {};
    api.deleteKnowledgeArticle.mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    const { dialog, user } = await openDeleteConfirmation();
    const confirm = within(dialog).getByRole("button", {
      name: "Xóa bài viết",
    });

    await user.click(confirm);
    const pendingConfirm = within(dialog).getByRole("button", {
      name: "Đang xử lý...",
    });
    expect(api.deleteKnowledgeArticle).toHaveBeenCalledTimes(1);
    expect(pendingConfirm).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Hủy" })).toBeDisabled();
    await user.click(pendingConfirm);
    await user.keyboard("{Escape}");
    expect(api.deleteKnowledgeArticle).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("dialog", { name: "Xác nhận xóa bài viết" }),
    ).toBeInTheDocument();

    rejectDelete(new KnowledgeApiError(409, "Article could not be deleted."));
    await waitFor(() =>
      expect(api.toastError).toHaveBeenCalledWith(
        "Article could not be deleted.",
      ),
    );
    expect(
      screen.getByRole("dialog", { name: "Xác nhận xóa bài viết" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Xóa bài viết" }),
    ).toBeEnabled();
  });
});
