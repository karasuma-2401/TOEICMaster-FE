"use client";

import { adminFocus } from "@/features/admin/components/content/admin-styles";
import type { KnowledgeArticleStatus } from "../types";

const STATUS_STYLES: Record<KnowledgeArticleStatus, string> = {
  Draft:
    "bg-(--admin-warning-soft) text-(--admin-warning) border-(--admin-warning)/20",
  Published:
    "bg-(--admin-success-soft) text-(--admin-success) border-(--admin-success)/20",
  Archived:
    "bg-(--admin-surface-muted) text-(--admin-ink-soft) border-(--admin-border)",
};

const STATUS_LABELS: Record<KnowledgeArticleStatus, string> = {
  Draft: "Bản nháp",
  Published: "Đã xuất bản",
  Archived: "Lưu trữ",
};

export function KnowledgeStatusBadge({
  status,
}: {
  status: KnowledgeArticleStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

interface KnowledgePaginationProps {
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  itemLabel: string;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (nextPage: number) => void;
  className?: string;
}

export function KnowledgePagination({
  pageNumber,
  totalPages,
  totalCount,
  itemLabel,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  className = "border-t border-(--admin-border) px-4 py-3",
}: KnowledgePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between text-xs text-(--admin-muted) ${className}`}
    >
      <span>
        Trang {pageNumber} / {totalPages} ({totalCount} {itemLabel})
      </span>
      <div className="flex gap-2">
        <button
          className={`rounded-md border border-(--admin-border) bg-white px-3 py-1 font-semibold text-(--admin-ink) transition hover:bg-(--admin-surface-muted) disabled:opacity-40 ${adminFocus}`}
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(pageNumber - 1)}
          type="button"
        >
          Trước
        </button>
        <button
          className={`rounded-md border border-(--admin-border) bg-white px-3 py-1 font-semibold text-(--admin-ink) transition hover:bg-(--admin-surface-muted) disabled:opacity-40 ${adminFocus}`}
          disabled={!hasNextPage}
          onClick={() => onPageChange(pageNumber + 1)}
          type="button"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
