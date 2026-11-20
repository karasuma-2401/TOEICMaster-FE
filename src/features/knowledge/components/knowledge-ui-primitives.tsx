"use client";

import type { KnowledgeArticleStatus } from "../types";

const STATUS_STYLES: Record<KnowledgeArticleStatus, string> = {
  Draft: "bg-(--sp-warning-bg) text-(--sp-warning) border-(--sp-warning-line)",
  Published:
    "bg-(--sp-success-bg) text-(--sp-success) border-(--sp-success-border-soft)",
  Archived: "bg-(--sp-neutral-bg) text-(--sp-ink-2) border-(--sp-line)",
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
  className = "border-t border-(--sp-line) px-4 py-3",
}: KnowledgePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between text-xs text-(--sp-ink-2) ${className}`}
    >
      <span>
        Trang {pageNumber} / {totalPages} ({totalCount} {itemLabel})
      </span>
      <div className="flex gap-2">
        <button
          className="rounded-md border border-(--sp-line) px-3 py-1 disabled:opacity-40"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(pageNumber - 1)}
          type="button"
        >
          Trước
        </button>
        <button
          className="rounded-md border border-(--sp-line) px-3 py-1 disabled:opacity-40"
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
