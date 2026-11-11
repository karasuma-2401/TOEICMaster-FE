"use client";

import { useEffect, useState, type DragEvent, type ReactNode } from "react";
import { adminFocus } from "./admin-styles";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Short "key: value" requirements, used instead of paragraphs of instructions. */
export function ImportSpec({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs leading-5">
      {rows.map(([term, detail]) => (
        <div className="contents" key={term}>
          <dt className="text-[var(--admin-muted)]">{term}</dt>
          <dd className="text-[var(--admin-ink-soft)]">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One-row file picker that also accepts a dropped workbook. */
export function ExcelFileSlot({
  file,
  maxMb,
  busy = false,
  busyLabel = "Đang kiểm tra…",
  onSelect,
  onReject,
}: {
  file: File | null;
  maxMb: number;
  busy?: boolean;
  busyLabel?: string;
  onSelect: (file: File) => void;
  onReject: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".xlsx"))
      onReject("Chỉ hỗ trợ file Excel .xlsx.");
    else if (candidate.size > maxMb * 1024 * 1024)
      onReject(`File Excel không được vượt quá ${maxMb} MiB.`);
    else onSelect(candidate);
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) accept(event.dataTransfer.files[0]);
  };

  return (
    <label
      className={`relative flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2.5 transition focus-within:border-[var(--admin-ink-soft)] ${dragging ? "border-[var(--admin-brand-red)] bg-[var(--admin-nav-active)]" : "border-[var(--admin-border)] hover:border-[#c9bdb1]"}`}
    >
      <span
        aria-hidden="true"
        className="grid h-9 w-10 shrink-0 place-items-center rounded bg-[var(--admin-surface-muted)] text-[10px] font-medium tracking-wide text-[var(--admin-ink-soft)]"
      >
        XLSX
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[var(--admin-ink)]">
          {file ? file.name : "Kéo file vào đây"}
        </span>
        <span className="block text-xs text-[var(--admin-muted)]">
          {busy
            ? busyLabel
            : file
              ? formatSize(file.size)
              : `Tối đa ${maxMb} MB`}
        </span>
      </span>
      <span className="shrink-0 text-[13px] font-medium text-[var(--admin-brand-red)]">
        {file ? "Đổi file" : "Chọn file"}
      </span>
      <input
        accept=".xlsx"
        aria-label="File Excel (.xlsx)"
        className={`absolute inset-0 opacity-0 ${busy ? "cursor-wait" : "cursor-pointer"}`}
        disabled={busy}
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = "";
        }}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        type="file"
      />
    </label>
  );
}

/** Compact helper that uploads an image and shows the id to paste in the file. */
export function ImportImageId({
  label,
  id,
  disabled,
  onSelect,
}: {
  label: string;
  id: string;
  disabled: boolean;
  onSelect: (file: File) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="min-w-0 text-[var(--admin-muted)]">
        {id ? (
          <>
            ImageAssetId:{" "}
            <code className="break-all text-[var(--admin-ink)]">{id}</code>
          </>
        ) : (
          label
        )}
      </span>
      <label className="shrink-0 cursor-pointer font-medium text-[var(--admin-brand-red)]">
        Tải ảnh
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) onSelect(selected);
            event.target.value = "";
          }}
          type="file"
        />
      </label>
    </div>
  );
}

/** Dialog frame shared by every Excel import. */
export function ExcelImportDialog({
  title,
  ariaLabel = title,
  summary,
  templateHref,
  closeLabel = "Đóng",
  submitLabel,
  canSubmit,
  busy,
  error,
  errorDetails = [],
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  ariaLabel?: string;
  summary: string;
  templateHref?: string;
  closeLabel?: string;
  submitLabel: string;
  canSubmit: boolean;
  busy: boolean;
  error?: string | null;
  errorDetails?: string[];
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[rgb(43_39_36/40%)] p-4">
      <dialog
        aria-label={ariaLabel}
        aria-modal="true"
        className="static m-0 w-full max-w-[480px] rounded-xl bg-[var(--admin-surface)] p-0 text-[var(--admin-ink)] shadow-[0_16px_48px_rgb(43_39_36/22%)]"
        open
      >
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <h2>{title}</h2>
            <p className="mt-0.5 text-[13px] text-[var(--admin-muted)]">
              {summary}
            </p>
          </div>
          <button
            aria-label={closeLabel}
            className={`-mr-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-ink)] disabled:cursor-not-allowed ${adminFocus}`}
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="size-3.5" viewBox="0 0 12 12">
              <path
                d="m2.5 2.5 7 7m0-7-7 7"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.3"
              />
            </svg>
          </button>
        </header>
        <div className="space-y-3 px-5 py-4">
          {children}
          {error && (
            <div
              className="text-[13px] text-[var(--admin-danger)]"
              role="alert"
            >
              <p>{error}</p>
              {errorDetails.length > 0 && (
                <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {errorDetails.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-[var(--admin-border)] px-5 py-3">
          {templateHref ? (
            <a
              className={`rounded text-[13px] text-[var(--admin-ink-soft)] underline decoration-[var(--admin-border)] underline-offset-4 hover:text-[var(--admin-ink)] ${adminFocus}`}
              download
              href={templateHref}
            >
              Tải file mẫu
            </a>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            <button
              className={`h-9 cursor-pointer rounded-lg px-3 text-[13px] font-medium text-[var(--admin-ink-soft)] hover:bg-[var(--admin-surface-muted)] disabled:cursor-not-allowed ${adminFocus}`}
              disabled={busy}
              onClick={onClose}
              type="button"
            >
              Hủy
            </button>
            <button
              className={`admin-primary-action h-9 cursor-pointer rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed ${adminFocus}`}
              disabled={!canSubmit || busy}
              onClick={onSubmit}
              type="button"
            >
              {submitLabel}
            </button>
          </div>
        </footer>
      </dialog>
    </div>
  );
}
