"use client";

import Link from "next/link";
import type { KnowledgeArticleDetail, KnowledgeArticleStatus } from "../types";

interface KnowledgeEditorTopbarProps {
  article: KnowledgeArticleDetail | null;
  currentStatus: KnowledgeArticleStatus;
  liveReadMinutes: number;
  tocCount: number;
  mode: "edit" | "preview";
  saving: boolean;
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
  onModeChange,
  onSave,
  onStatusAction,
}: KnowledgeEditorTopbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--sp-line) bg-(--sp-surface) px-5 py-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <Link
          className="rounded-lg border border-(--sp-line) px-3 py-1.5 text-xs font-semibold text-(--sp-ink-2) hover:bg-(--sp-subtle)"
          href="/admin/knowledge"
        >
          ← Danh sách
        </Link>
        <div>
          <h1 className="text-base font-bold text-(--sp-ink)">
            {article ? "Chỉnh sửa bài viết" : "Tạo bài viết kiến thức mới"}
          </h1>
          <p className="text-xs text-(--sp-ink-3)">
            Trạng thái: <strong>{currentStatus}</strong> · {liveReadMinutes}{" "}
            phút đọc · {tocCount} mục lục
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-(--sp-line) bg-(--sp-subtle) p-0.5 text-xs font-semibold">
          <button
            className={`rounded-md px-3 py-1.5 transition ${
              mode === "edit"
                ? "bg-white text-(--sp-ink) shadow-sm"
                : "text-(--sp-ink-2)"
            }`}
            onClick={() => onModeChange("edit")}
            type="button"
          >
            Soạn thảo
          </button>
          <button
            className={`rounded-md px-3 py-1.5 transition ${
              mode === "preview"
                ? "bg-white text-(--sp-brand) shadow-sm"
                : "text-(--sp-ink-2)"
            }`}
            onClick={() => onModeChange("preview")}
            type="button"
          >
            Xem trước (Preview)
          </button>
        </div>

        <button
          className="rounded-lg bg-(--sp-brand) px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          disabled={saving}
          onClick={onSave}
          type="button"
        >
          {saving ? "Đang lưu..." : article ? "Lưu thay đổi" : "Lưu bản nháp"}
        </button>

        {article ? (
          <>
            {article.status !== "Published" ? (
              <button
                className="rounded-lg bg-(--sp-success) px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                disabled={saving}
                onClick={() => onStatusAction("publish")}
                type="button"
              >
                Xuất bản
              </button>
            ) : (
              <button
                className="rounded-lg bg-(--sp-warning-bg) px-3.5 py-2 text-xs font-semibold text-(--sp-warning) hover:opacity-90 disabled:opacity-50"
                disabled={saving}
                onClick={() => onStatusAction("unpublish")}
                type="button"
              >
                Gỡ xuất bản
              </button>
            )}
            {article.status !== "Archived" ? (
              <button
                className="rounded-lg border border-(--sp-line) px-3 py-2 text-xs font-semibold text-(--sp-ink-2) hover:bg-(--sp-subtle)"
                disabled={saving}
                onClick={() => onStatusAction("archive")}
                type="button"
              >
                Lưu trữ
              </button>
            ) : null}
            <button
              className="rounded-lg border border-(--sp-line) px-3 py-2 text-xs font-semibold text-(--sp-danger) hover:bg-(--sp-danger-bg) disabled:cursor-not-allowed disabled:opacity-40"
              disabled={saving || article.status === "Published"}
              onClick={() => onStatusAction("delete")}
              title={
                article.status === "Published"
                  ? "Gỡ xuất bản trước khi xóa"
                  : "Xóa bài viết"
              }
              type="button"
            >
              Xóa
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
