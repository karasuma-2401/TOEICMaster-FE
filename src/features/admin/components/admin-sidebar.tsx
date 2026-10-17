"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/features/user/components/brand-mark";
import {
  adminNavigation,
  getAdminNavigationItem,
} from "@/features/admin/navigation";

interface AdminSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

export function AdminSidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const activeItem = getAdminNavigationItem(pathname);

  return (
    <>
      {isMobileOpen && (
        <button
          aria-label="Đóng menu quản trị"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          type="button"
        />
      )}
      <aside
        aria-label="Thanh điều hướng quản trị"
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-[72px]" : "lg:w-[264px]"}`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-[var(--admin-border)] px-5">
          <BrandMark />
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold tracking-tight text-[var(--admin-ink)]">
                TOEICMaster
              </p>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--admin-muted)]">
                QUẢN TRỊ
              </p>
            </div>
          )}
          <button
            aria-label="Đóng menu quản trị trên thiết bị di động"
            className="ml-auto rounded-lg p-2 text-[var(--admin-ink-soft)] hover:bg-[var(--admin-surface-muted)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)] lg:hidden"
            onClick={onCloseMobile}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <nav aria-label="Quản trị" className="flex-1 px-3 py-6">
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.12em] text-[var(--admin-muted)]">
              QUẢN TRỊ
            </p>
          )}
          <div className="space-y-1">
            {adminNavigation.map((item) => {
              const current = activeItem?.href === item.href;
              return current ? (
                <Link
                  aria-current="page"
                  className="relative flex min-h-10 items-center gap-3 rounded-lg bg-[var(--admin-nav-active)] px-3 text-sm font-semibold text-[var(--admin-brand-red)] before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-[var(--admin-brand-red)] before:to-[var(--admin-brand-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
                  href={item.href}
                  key={item.label}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-6 place-items-center text-base"
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ) : (
                <button
                  className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[var(--admin-muted)] opacity-70"
                  disabled
                  key={item.label}
                  title="Tính năng sắp có"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-6 place-items-center text-base"
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-full bg-[var(--admin-surface-muted)] px-2 py-0.5 text-[9px] font-semibold">
                        Sắp có
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-[var(--admin-border)] p-3">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--admin-surface-muted)] p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--admin-highlight)] to-[var(--admin-brand-orange)] text-sm font-bold text-[var(--admin-danger)]">
              A
            </span>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--admin-ink)]">
                  Quản trị viên
                </p>
                <p className="truncate text-xs text-[var(--admin-muted)]">
                  Admin
                </p>
              </div>
            )}
          </div>
          <button
            aria-label={
              isCollapsed
                ? "Mở rộng thanh điều hướng"
                : "Thu gọn thanh điều hướng"
            }
            className="mt-2 hidden w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-ink)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)] lg:block"
            onClick={onToggleCollapsed}
            type="button"
          >
            {isCollapsed ? "›" : "‹  Thu gọn thanh điều hướng"}
          </button>
        </div>
      </aside>
    </>
  );
}

export function useAdminSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return {
    isCollapsed,
    isMobileOpen,
    closeMobile: () => setIsMobileOpen(false),
    openMobile: () => setIsMobileOpen(true),
    toggleCollapsed: () => setIsCollapsed((current) => !current),
  };
}
