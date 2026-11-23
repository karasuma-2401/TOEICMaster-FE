"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdminNavigationItem } from "@/features/admin/navigation";

interface AdminTopbarProps {
  onOpenMenu: () => void;
}

export function AdminTopbar({ onOpenMenu }: AdminTopbarProps) {
  const pathname = usePathname();
  const currentItem = getAdminNavigationItem(pathname);
  const title = currentItem?.label ?? "Admin";
  const description = currentItem?.description ?? "TOEICMaster admin area";

  return (
    <header className="sticky top-0 z-30 flex h-[55px] items-center gap-4 border-b border-[var(--admin-border)] bg-white/95 px-5 backdrop-blur sm:px-[25px]">
      <button
        aria-label="Open admin menu"
        className="grid size-9 place-items-center rounded-lg border border-[var(--admin-border)] text-xl text-[var(--admin-ink)] hover:bg-[var(--admin-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)] lg:hidden"
        onClick={onOpenMenu}
        type="button"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 text-xs">
          <li className="hidden text-[var(--admin-muted)] sm:block">Admin</li>
          <li
            aria-hidden="true"
            className="hidden text-[var(--admin-muted)] sm:block"
          >
            /
          </li>
          <li
            aria-current="page"
            className="truncate font-medium text-[var(--admin-muted)]"
          >
            {title}
          </li>
        </ol>
        <p className="sr-only">{description}</p>
      </nav>
      <Link
        aria-label="Back to practice"
        className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg border border-[var(--admin-border)] px-3 text-[13px] font-medium text-[var(--admin-ink)] transition hover:border-[var(--admin-brand-red)] hover:text-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
        href="/#home-skills"
      >
        ← <span className="ml-1.5 sm:hidden">Practice</span>
        <span className="ml-1.5 hidden sm:inline">Back to practice</span>
      </Link>
      <button
        aria-label="Admin notifications"
        className="grid size-9 place-items-center rounded-full bg-[var(--admin-surface-muted)] text-[var(--admin-muted)] transition hover:text-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
        type="button"
      >
        <span aria-hidden="true" className="text-base">
          ◌
        </span>
      </button>
      <span className="grid size-9 place-items-center rounded-full bg-[var(--admin-brand-orange)] text-xs font-semibold text-white">
        M
      </span>
    </header>
  );
}
