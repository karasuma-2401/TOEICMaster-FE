"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[255px] flex-col border-r border-[var(--admin-border)] bg-white transition-[transform,width] duration-200 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-[72px]" : "lg:w-[255px]"}`}
      >
        <div className="flex h-[92px] items-center gap-2 px-5">
          <span aria-hidden="true" className="flex items-end gap-0.5">
            <i className="h-5 w-1 rounded-full bg-[#e34229]" />
            <i className="h-6 w-1 rounded-full bg-[#f05a21]" />
            <i className="h-6 w-1 rounded-full bg-[#fb8b24]" />
          </span>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-[-0.04em] text-[var(--admin-ink)]">
                TOEICMaster
              </p>
              <p className="mt-0.5 w-fit rounded-sm bg-[var(--admin-brand-red)] px-1 py-px text-[6px] font-bold tracking-[0.08em] text-white">
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

        <nav aria-label="Quản trị" className="flex-1 px-4 py-2">
          {!isCollapsed && (
            <p className="mb-2 px-2 text-[9px] font-medium tracking-[0.1em] text-[var(--admin-muted)]">
              QUẢN TRỊ
            </p>
          )}
          <div className="space-y-1">
            {adminNavigation.map((item) => {
              const current = activeItem?.href === item.href;
              return item.enabled ? (
                <Link
                  aria-current={current ? "page" : undefined}
                  className={`relative flex min-h-9 items-center gap-2 rounded-md px-2 text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)] ${
                    current
                      ? "bg-[var(--admin-nav-active)] font-semibold text-[var(--admin-ink)]"
                      : "font-normal text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-ink)]"
                  }`}
                  href={item.href}
                  key={item.label}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-5 place-items-center text-sm"
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ) : (
                <button
                  className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] font-normal text-[var(--admin-muted)] opacity-70"
                  disabled
                  key={item.label}
                  title="Tính năng sắp có"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-5 place-items-center text-sm"
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

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2 px-1 text-[10px] text-[var(--admin-muted)]">
            <span aria-hidden="true">⇱</span>
            {!isCollapsed && <span>Thu nhỏ</span>}
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--admin-brand-orange)] text-[10px] font-bold text-white">
              M
            </span>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold text-[var(--admin-ink)]">
                  Quản trị viên
                </p>
                <p className="truncate text-[8px] text-[var(--admin-muted)]">
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
            className="sr-only"
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
