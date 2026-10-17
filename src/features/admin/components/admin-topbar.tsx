"use client";

import { usePathname } from "next/navigation";
import { getAdminNavigationItem } from "@/features/admin/navigation";

interface AdminTopbarProps {
  onOpenMenu: () => void;
}

export function AdminTopbar({ onOpenMenu }: AdminTopbarProps) {
  const pathname = usePathname();
  const currentItem = getAdminNavigationItem(pathname);
  const title = currentItem?.label ?? "Quản trị";
  const description =
    currentItem?.description ?? "Khu vực quản trị TOEICMaster";

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 px-5 backdrop-blur sm:px-8">
      <button
        aria-label="Mở menu quản trị"
        className="grid size-10 place-items-center rounded-xl border border-[var(--admin-border)] text-xl text-[var(--admin-ink)] hover:bg-[var(--admin-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)] lg:hidden"
        onClick={onOpenMenu}
        type="button"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <nav aria-label="Đường dẫn" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 text-sm">
          <li className="hidden text-[var(--admin-muted)] sm:block">
            Quản trị
          </li>
          <li
            aria-hidden="true"
            className="hidden text-[var(--admin-muted)] sm:block"
          >
            /
          </li>
          <li
            aria-current="page"
            className="truncate font-bold text-[var(--admin-ink)]"
          >
            {title}
          </li>
        </ol>
        <p className="mt-1 hidden text-xs text-[var(--admin-muted)] sm:block">
          {description}
        </p>
      </nav>
      <span className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">
        Admin
      </span>
    </header>
  );
}
