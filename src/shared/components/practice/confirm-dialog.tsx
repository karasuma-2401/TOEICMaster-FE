"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { primaryAction, secondaryAction } from "./styles";

/** Modal confirmation; focuses the cancel action and closes on Escape. */
export function ConfirmDialog({
  id,
  title,
  children,
  cancelLabel = "Quay lại",
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  id: string;
  title: string;
  children: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const focusCancel = window.setTimeout(
      () => cancelButton.current?.focus(),
      0,
    );
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusCancel);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <dialog
        aria-labelledby={id}
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        open
      >
        <h2 className="text-xl font-bold text-slate-900" id={id}>
          {title}
        </h2>
        <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className={secondaryAction}
            onClick={onCancel}
            ref={cancelButton}
            type="button"
          >
            {cancelLabel}
          </button>
          <button className={primaryAction} onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </div>
  );
}
