import type { ReactNode } from "react";

/** Right-side drawer used by admin create/edit forms. */
export function AdminDrawer({
  label,
  eyebrow,
  title,
  onClose,
  footer,
  width = "max-w-2xl",
  children,
}: {
  label: string;
  eyebrow: string;
  title: string;
  onClose: () => void;
  footer: ReactNode;
  width?: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
      <dialog
        aria-label={label}
        aria-modal="true"
        className={`flex h-full w-full flex-col bg-white shadow-2xl ${width}`}
        open
      >
        <header className="flex justify-between gap-4 border-b border-[var(--admin-border)] p-6">
          <div>
            <p className="text-xs font-bold text-[var(--admin-brand-red)]">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-bold">{title}</h2>
          </div>
          <button
            aria-label={`Đóng ${label.toLocaleLowerCase("vi-VN")}`}
            className="size-9 rounded-lg text-xl hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">{children}</div>
        <footer className="flex flex-wrap justify-end gap-3 border-t border-[var(--admin-border)] p-5">
          {footer}
        </footer>
      </dialog>
    </div>
  );
}

/** Centered modal used by admin previews. */
export function AdminModal({
  label,
  onClose,
  width = "max-w-2xl",
  children,
}: {
  label: string;
  onClose: () => void;
  width?: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4">
      <dialog
        aria-label={label}
        aria-modal="true"
        className={`relative max-h-[90dvh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${width}`}
        open
      >
        <button
          aria-label={`Đóng ${label.toLocaleLowerCase("vi-VN")}`}
          className="absolute right-4 top-4 size-9 rounded-lg text-xl hover:bg-slate-100"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        {children}
      </dialog>
    </div>
  );
}
