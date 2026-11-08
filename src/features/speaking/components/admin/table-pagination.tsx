export function TablePagination({
  total,
  unit,
  page,
  pages,
  onPage,
}: {
  total: number;
  unit: string;
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  return (
    <footer className="flex items-center justify-between border-t border-[var(--admin-border)] p-4 text-xs text-[var(--admin-muted)]">
      <span>
        {total} {unit}
      </span>
      <div className="flex gap-2">
        <button
          aria-label="Trang trước"
          className="size-8 rounded border border-[var(--admin-border)] disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          type="button"
        >
          ‹
        </button>
        <span className="grid size-8 place-items-center rounded bg-[var(--admin-nav-active)] font-bold text-[var(--admin-brand-red)]">
          {page}
        </span>
        <button
          aria-label="Trang sau"
          className="size-8 rounded border border-[var(--admin-border)] disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          type="button"
        >
          ›
        </button>
      </div>
    </footer>
  );
}
