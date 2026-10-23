import type { ReactNode } from "react";

export function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600"
      />
      <p>{label}</p>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
  retryLabel = "Thử lại",
}: {
  message: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      aria-live="assertive"
      className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          className="mt-3 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-red-600"
          onClick={onRetry}
          type="button"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <p
      aria-live="assertive"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      role="alert"
    >
      {children}
    </p>
  );
}

export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
