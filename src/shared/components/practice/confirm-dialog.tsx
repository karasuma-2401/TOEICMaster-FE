"use client";

import type { ReactNode } from "react";
import { ConfirmDialog as SharedConfirmDialog } from "@/shared/components/ui/dialog";
import { primaryAction, secondaryAction } from "./styles";

/** Modal confirmation; focuses the cancel action and closes on Escape. */
export function ConfirmDialog({
  id,
  title,
  children,
  cancelLabel = "Go back",
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
  return (
    <SharedConfirmDialog
      cancelClassName={secondaryAction}
      cancelLabel={cancelLabel}
      confirmClassName={primaryAction}
      confirmLabel={confirmLabel}
      id={id}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
    >
      {children}
    </SharedConfirmDialog>
  );
}
