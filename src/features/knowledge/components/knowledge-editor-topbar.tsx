"use client";

import Link from "next/link";
import { adminFocus } from "@/features/admin/components/content/admin-styles";
import type { KnowledgeArticleDetail, KnowledgeArticleStatus } from "../types";

interface KnowledgeEditorTopbarProps {
  article: KnowledgeArticleDetail | null;
  currentStatus: KnowledgeArticleStatus;
  liveReadMinutes: number;
  tocCount: number;
  mode: "edit" | "preview";
  saving: boolean;
  hasChanges: boolean;
  onModeChange: (mode: "edit" | "preview") => void;
  onSave: () => void;
  onStatusAction: (
    action: "publish" | "unpublish" | "archive" | "delete",
  ) => void;
}

export function KnowledgeEditorTopbar({
  article,
  currentStatus,
  liveReadMinutes,
  tocCount,
  mode,
  saving,
  hasChanges,
  onModeChange,
  onSave,
  onStatusAction,
}: KnowledgeEditorTopbarProps) {
  const saveDisabled = saving || (Boolean(article) && !hasChanges);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--admin-border) bg-(--admin-surface) px-5 py-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <Link
          className={`rounded-lg border border-(--admin-border) bg-white px-3 py-1.5 text-xs font-semibold text-(--admin-ink-soft) transition hover:bg-(--admin-surface-muted) ${adminFocus}`}
          href="/admin/knowledge"
        >
          ← Back to list
        </Link>
        <div>
          <h1 className="text-base font-bold text-(--admin-ink)">
            {article ? "Edit article" : "Create new knowledge article"}
          </h1>
          <p className="text-xs text-(--admin-muted)">
            Status: <strong>{currentStatus}</strong> - {liveReadMinutes} min
            read - {tocCount} headings
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-(--admin-border) bg-(--admin-surface-muted) p-0.5 text-xs font-semibold">
          <button
            className={`cursor-pointer rounded-md px-3 py-1.5 transition ${adminFocus} ${
              mode === "edit"
                ? "bg-white text-(--admin-ink) shadow-sm"
                : "text-(--admin-muted) hover:text-(--admin-ink-soft)"
            }`}
            onClick={() => onModeChange("edit")}
            type="button"
          >
            Edit
          </button>
          <button
            className={`cursor-pointer rounded-md px-3 py-1.5 transition ${adminFocus} ${
              mode === "preview"
                ? "bg-white text-(--admin-brand-red) shadow-sm"
                : "text-(--admin-muted) hover:text-(--admin-ink-soft)"
            }`}
            onClick={() => onModeChange("preview")}
            type="button"
          >
            Preview
          </button>
        </div>

        <button
          className={`admin-primary-action cursor-pointer rounded-lg px-4 py-2 text-xs font-bold ${adminFocus}`}
          disabled={saveDisabled}
          onClick={onSave}
          title={
            article && !hasChanges
              ? "No changes to save"
              : article
                ? "Save article changes"
                : "Save draft article"
          }
          type="button"
        >
          {saving ? "Saving..." : article ? "Save changes" : "Save draft"}
        </button>

        {article ? (
          <>
            {article.status !== "Published" ? (
              <button
                className={`rounded-lg bg-(--admin-success) px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 ${adminFocus}`}
                disabled={saving}
                onClick={() => onStatusAction("publish")}
                type="button"
              >
                Publish
              </button>
            ) : (
              <button
                className={`rounded-lg bg-(--admin-warning-soft) px-3.5 py-2 text-xs font-semibold text-(--admin-warning) hover:opacity-90 disabled:opacity-50 ${adminFocus}`}
                disabled={saving}
                onClick={() => onStatusAction("unpublish")}
                type="button"
              >
                Unpublish
              </button>
            )}
            {article.status !== "Archived" ? (
              <button
                className={`rounded-lg border border-(--admin-border) bg-white px-3 py-2 text-xs font-semibold text-(--admin-ink-soft) hover:bg-(--admin-surface-muted) ${adminFocus}`}
                disabled={saving}
                onClick={() => onStatusAction("archive")}
                type="button"
              >
                Archive
              </button>
            ) : null}
            <button
              className={`rounded-lg border border-(--admin-border) bg-white px-3 py-2 text-xs font-semibold text-(--admin-danger) hover:bg-(--admin-danger-soft) disabled:cursor-not-allowed disabled:opacity-40 ${adminFocus}`}
              disabled={saving || article.status === "Published"}
              onClick={() => onStatusAction("delete")}
              title={
                article.status === "Published"
                  ? "Unpublish before deleting"
                  : "Delete article"
              }
              type="button"
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
