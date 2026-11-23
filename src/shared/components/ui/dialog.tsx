"use client";

import { useRef, type ComponentProps, type ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

/** Root dialog controller backed by Radix UI Dialog. */
const Dialog = DialogPrimitive.Root;

/** Trigger button or element that opens the dialog. */
const DialogTrigger = DialogPrimitive.Trigger;

/** Portal container for rendering dialog overlays outside local stacking contexts. */
const DialogPortal = DialogPrimitive.Portal;

/** Close control for dismissing the dialog. */
const DialogClose = DialogPrimitive.Close;

/** Semi-transparent backdrop rendered behind the dialog surface. */
function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

export type DialogVariant = "modal" | "drawer";
export type DialogSize = "sm" | "md" | "lg" | "xl" | "full";

const modalSizeClasses: Record<DialogSize, string> = {
  sm: "w-[min(28rem,calc(100vw-2rem))]",
  md: "w-[min(36rem,calc(100vw-2rem))]",
  lg: "w-[min(48rem,calc(100vw-2rem))]",
  xl: "w-[min(64rem,calc(100vw-2rem))]",
  full: "h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)]",
};

const drawerSizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full",
};

export interface DialogContentProps extends ComponentProps<
  typeof DialogPrimitive.Content
> {
  variant?: DialogVariant;
  size?: DialogSize;
  showCloseButton?: boolean;
  closeLabel?: string;
}

/** Accessible modal or slide-over drawer content surface with focus trapping and Escape handling. */
function DialogContent({
  className,
  children,
  variant = "modal",
  size = "md",
  showCloseButton = true,
  closeLabel = "Close",
  ...props
}: DialogContentProps) {
  const layoutClassName =
    variant === "drawer"
      ? cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-y-auto border-l border-[var(--tm-border,#e8e3e0)] bg-[var(--tm-surface,#ffffff)] p-6 shadow-2xl",
          drawerSizeClasses[size],
        )
      : cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[var(--tm-border,#e8e3e0)] bg-[var(--tm-surface,#ffffff)] p-6 shadow-2xl",
          modalSizeClasses[size],
        );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "text-[var(--tm-ink,#302b29)] outline-none",
          layoutClassName,
          className,
        )}
        data-testid="ui-dialog-content"
        data-variant={variant}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-lg text-[var(--tm-ink-muted,#5f5953)] transition hover:bg-[var(--tm-surface-muted,#f5f2f0)] hover:text-[var(--tm-ink,#302b29)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring,#ff5a1f)]"
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/** Header layout wrapper for dialog title and description. */
function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  );
}

/** Footer action row aligned for modal/drawer primary and secondary controls. */
function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-wrap justify-end gap-3", className)}
      {...props}
    />
  );
}

/** Accessible heading bound to the dialog via aria-labelledby. */
function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-xl font-bold text-[var(--tm-ink,#302b29)]",
        className,
      )}
      {...props}
    />
  );
}

/** Accessible description bound to the dialog via aria-describedby. */
function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "text-sm leading-6 text-[var(--tm-ink-muted,#5f5953)]",
        className,
      )}
      {...props}
    />
  );
}

export interface ConfirmDialogProps {
  open?: boolean;
  id?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelClassName?: string;
  confirmClassName?: string;
  destructive?: boolean;
}

/** Accessible confirmation modal that focuses the cancel button initially and handles Escape cleanly. */
function ConfirmDialog({
  open = true,
  id,
  title,
  description,
  children,
  cancelLabel = "Go back",
  confirmLabel,
  onCancel,
  onConfirm,
  cancelClassName,
  confirmClassName,
  destructive = false,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const body = description ?? children;

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
      open={open}
    >
      <DialogContent
        {...(id ? { "aria-labelledby": id } : {})}
        {...(body ? {} : { "aria-describedby": undefined })}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelButtonRef.current?.focus();
        }}
        showCloseButton={false}
        size="sm"
      >
        <DialogTitle id={id}>{title}</DialogTitle>
        {body ? (
          <DialogPrimitive.Description asChild>
            <div className="mt-3 text-sm leading-6 text-[var(--tm-ink-muted,#5f5953)]">
              {body}
            </div>
          </DialogPrimitive.Description>
        ) : null}
        <DialogFooter>
          <button
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--tm-border-strong,#d9d2ce)] bg-[var(--tm-surface,#ffffff)] px-5 text-sm font-bold text-[var(--tm-ink,#302b29)] transition hover:bg-[var(--tm-surface-muted,#f5f2f0)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring,#ff5a1f)]",
              cancelClassName,
            )}
            data-testid="confirm-dialog-cancel"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring,#ff5a1f)]",
              destructive
                ? "bg-[var(--tm-danger,#dc2626)] hover:brightness-95"
                : "bg-[var(--tm-brand,#e04810)] hover:brightness-105",
              confirmClassName,
            )}
            data-testid="confirm-dialog-confirm"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  ConfirmDialog,
};
