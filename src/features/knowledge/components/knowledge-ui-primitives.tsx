"use client";

import {
  adminFocus,
  adminSecondary,
} from "@/features/admin/components/content/admin-styles";
import { useEffect, useLayoutEffect, useRef } from "react";
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
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

interface KnowledgeConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function KnowledgeConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận xóa",
  cancelLabel = "Hủy",
  pending = false,
  onConfirm,
  onCancel,
}: KnowledgeConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    cancelButtonRef.current?.focus();

    return () => {
      if (dialog.open && typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const previouslyFocused = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (previouslyFocused?.isConnected) previouslyFocused.focus();
  }, [open]);

  function handleCancel() {
    if (!pending) onCancel();
  }

  useLayoutEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const activeDialog: HTMLDialogElement = dialog;

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pending) onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        activeDialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        (event.shiftKey &&
          (document.activeElement === first ||
            !activeDialog.contains(document.activeElement))) ||
        (!event.shiftKey &&
          (document.activeElement === last ||
            !activeDialog.contains(document.activeElement)))
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }

    function handleNativeCancel(event: Event) {
      event.preventDefault();
      if (!pending) onCancel();
    }

    function handleBackdropClick(event: MouseEvent) {
      if (event.target === activeDialog && !pending) onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    activeDialog.addEventListener("cancel", handleNativeCancel);
    activeDialog.addEventListener("click", handleBackdropClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      activeDialog.removeEventListener("cancel", handleNativeCancel);
      activeDialog.removeEventListener("click", handleBackdropClick);
    };
  }, [open, pending, onCancel]);

  return (
    <dialog
      aria-label={title}
      aria-modal="true"
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/50 p-4 backdrop-blur-[1px]"
      ref={dialogRef}
    >
      <div className="w-full max-w-md rounded-2xl border border-(--admin-border) bg-(--admin-surface) p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--admin-danger-soft) text-(--admin-danger)">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-(--admin-ink)">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-(--admin-ink-soft)">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            className={`${adminSecondary} h-10 cursor-pointer px-4`}
            disabled={pending}
            onClick={handleCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-(--admin-danger) px-4 text-sm font-bold text-white shadow-xs transition duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${adminFocus}`}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
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
