"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { adminFocus } from "@/features/admin/components/content/admin-styles";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/shared/components/ui/dialog";

/**
 * Full-viewport Speaking admin editor (test builder, exercise form) built on
 * the shared Radix `Dialog` primitives. Unlike a native `<dialog open>` it
 * traps Tab focus, hides the page behind it from assistive tech, locks body
 * scroll, closes on Escape through `onClose` (so unsaved-change guards still
 * run) and returns focus to the opener. The surface is opaque and covers the
 * viewport, so the list underneath is never visible through it.
 *
 * The portal targets the nearest `.sp-theme` ancestor (the admin layout) so the
 * Speaking font variables and `--sp-*` tokens keep applying; it falls back to
 * `document.body` when there is none.
 */
export function SpeakingWorkspaceDialog({
  label,
  eyebrow,
  title,
  badge,
  onClose,
  actions,
  children,
}: {
  label: string;
  eyebrow: string;
  title: string;
  badge?: ReactNode;
  onClose: () => void;
  actions: ReactNode;
  children: ReactNode;
}) {
  /** `undefined` until the anchor mounts, then the portal target (or `null` = body). */
  const [container, setContainer] = useState<HTMLElement | null | undefined>(
    undefined,
  );
  const opener = useRef<HTMLElement | null>(null);
  const anchor = useCallback((node: HTMLSpanElement | null) => {
    if (!node) return;
    const active = document.activeElement;
    opener.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
    setContainer(node.closest<HTMLElement>(".sp-theme"));
  }, []);
  /**
   * Callers unmount the workspace while it is still `open`, which skips Radix'
   * close auto-focus, so return focus to the opener ourselves.
   */
  const content = useCallback((node: HTMLDivElement | null) => {
    if (node) return;
    const target = opener.current;
    if (target)
      queueMicrotask(() => {
        if (target.isConnected) target.focus();
      });
  }, []);

  return (
    <>
      <span hidden ref={anchor} />
      {container !== undefined && (
        <Dialog
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
          open
        >
          <DialogPortal container={container ?? undefined}>
            <DialogOverlay className="z-[70] bg-[var(--admin-page)] backdrop-blur-none" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              aria-label={label}
              aria-labelledby={undefined}
              className="fixed inset-0 z-[70] flex h-dvh w-full flex-col bg-[var(--admin-page)] text-[var(--admin-ink)] outline-none"
              data-testid="speaking-workspace-dialog"
              ref={content}
            >
              <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-8">
                <button
                  aria-label={`Close ${label.toLocaleLowerCase("en-US")}`}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--admin-border)] px-3 text-sm font-bold hover:bg-[var(--admin-surface-muted)] ${adminFocus}`}
                  onClick={onClose}
                  type="button"
                >
                  <span aria-hidden="true">←</span>
                  <span className="hidden sm:inline">List</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
                    {eyebrow}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <DialogTitle className="truncate text-xl font-bold text-[var(--admin-ink)]">
                      {title}
                    </DialogTitle>
                    {badge}
                  </div>
                </div>
                <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                  {actions}
                </div>
              </header>
              <div className="min-w-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                {children}
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
    </>
  );
}
