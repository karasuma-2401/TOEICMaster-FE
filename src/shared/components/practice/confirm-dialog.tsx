"use client";

import type { ReactNode, RefObject } from "react";
import { ConfirmDialog as SharedConfirmDialog } from "@/shared/components/ui/dialog";
import { primaryAction, secondaryAction } from "./styles";

/** Modal confirmation; focuses the cancel action and closes on Escape. */
export function ConfirmDialog({
  open,
  id,
  title,
  children,
  cancelLabel = "Go back",
  confirmLabel,
  onCancel,
  onConfirm,
  returnFocusRef,
}: {
  open?: boolean;
  id: string;
  title: string;
  children: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
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
      open={open}
      returnFocusRef={returnFocusRef}
      title={title}
    >
      {children}
    </SharedConfirmDialog>
  );
}
