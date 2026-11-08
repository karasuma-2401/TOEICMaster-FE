import { Pagination } from "../ui/pagination";

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
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-(--sp-line) p-4 text-xs text-(--sp-ink-2)">
      <span>
        {total} {unit}
      </span>
      <Pagination onPage={onPage} page={page} pages={pages} />
    </footer>
  );
}
