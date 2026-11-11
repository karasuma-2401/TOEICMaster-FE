/** Numbered pagination; the caller owns the page state. */
export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  const cell =
    "sp-focus grid size-9 place-items-center rounded-lg border border-(--sp-line) bg-(--sp-surface) text-[13px] disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="Phân trang" className="flex items-center gap-2">
      <button
        aria-label="Trang trước"
        className={cell}
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        type="button"
      >
        ‹
      </button>
      {Array.from({ length: pages }, (_, index) => index + 1).map((item) => (
        <button
          aria-current={item === page ? "page" : undefined}
          className={`${cell} ${item === page ? "border-transparent bg-(--sp-orange-soft) font-semibold text-(--sp-brand)" : ""}`}
          key={item}
          onClick={() => onPage(item)}
          type="button"
        >
          {item}
        </button>
      ))}
      <button
        aria-label="Trang sau"
        className={cell}
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        type="button"
      >
        ›
      </button>
    </nav>
  );
}
