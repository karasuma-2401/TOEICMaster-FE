/** Loading and error rows for admin tables. */
export function AdminLoadState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (error)
    return (
      <div
        className="m-4 rounded-xl bg-[var(--admin-danger-soft)] p-4 text-sm text-[var(--admin-danger)]"
        role="alert"
      >
        <p className="font-semibold">{error}</p>
        <button
          className="mt-2 font-bold underline underline-offset-4"
          onClick={onRetry}
          type="button"
        >
          Thử lại
        </button>
      </div>
    );
  if (!loading) return null;
  return (
    <output aria-label="Đang tải" className="block space-y-2 p-4">
      {[0, 1, 2].map((row) => (
        <div
          className="h-12 animate-pulse rounded-lg bg-[var(--admin-skeleton)]"
          key={row}
        />
      ))}
    </output>
  );
}

export function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}
