"use client";

import type { ReactNode } from "react";
import { AdminSidebar, useAdminSidebarState } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children }: { children: ReactNode }) {
  const sidebar = useAdminSidebarState();

  return (
    <div className="min-h-dvh bg-[var(--admin-page)] text-[var(--admin-ink)]">
      <AdminSidebar
        isCollapsed={sidebar.isCollapsed}
        isMobileOpen={sidebar.isMobileOpen}
        onCloseMobile={sidebar.closeMobile}
        onToggleCollapsed={sidebar.toggleCollapsed}
      />
      <div
        className={`min-h-dvh transition-[padding] duration-200 ${sidebar.isCollapsed ? "lg:pl-[72px]" : "lg:pl-[264px]"}`}
      >
        <AdminTopbar onOpenMenu={sidebar.openMobile} />
        <main className="mx-auto w-full max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
