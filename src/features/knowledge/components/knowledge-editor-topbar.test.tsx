// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { KnowledgeArticleDetail } from "../types";
import { KnowledgeEditorTopbar } from "./knowledge-editor-topbar";

const article: KnowledgeArticleDetail = {
  id: "article-id",
  title: "Article title",
  slug: "article-title",
  summary: "Article summary",
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
  version: 1,
  content: { type: "doc", content: [{ type: "paragraph" }] },
  toc: [],
};

function renderTopbar({
  saving = false,
  hasChanges = false,
  currentArticle = article,
}: {
  saving?: boolean;
  hasChanges?: boolean;
  currentArticle?: KnowledgeArticleDetail | null;
} = {}) {
  return render(
    <KnowledgeEditorTopbar
      article={currentArticle}
      currentStatus="Draft"
      hasChanges={hasChanges}
      liveReadMinutes={1}
      mode="edit"
      onModeChange={vi.fn()}
      onSave={vi.fn()}
      onStatusAction={vi.fn()}
      saving={saving}
      tocCount={0}
    />,
  );
}

describe("KnowledgeEditorTopbar save gating", () => {
  it("disables saving unchanged existing articles but allows new drafts", () => {
    const { rerender } = renderTopbar();
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();

    rerender(
      <KnowledgeEditorTopbar
        article={null}
        currentStatus="Draft"
        hasChanges={false}
        liveReadMinutes={1}
        mode="edit"
        onModeChange={vi.fn()}
        onSave={vi.fn()}
        onStatusAction={vi.fn()}
        saving={false}
        tocCount={0}
      />,
    );
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
  });

  it("enables changed articles and disables them while a save is pending", () => {
    const { rerender } = renderTopbar({ hasChanges: true });
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();

    rerender(
      <KnowledgeEditorTopbar
        article={article}
        currentStatus="Draft"
        hasChanges
        liveReadMinutes={1}
        mode="edit"
        onModeChange={vi.fn()}
        onSave={vi.fn()}
        onStatusAction={vi.fn()}
        saving
        tocCount={0}
      />,
    );
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });
});
