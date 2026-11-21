"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useId, useSyncExternalStore } from "react";
import { BrandMark } from "@/features/user/components/brand-mark";
import {
  activeNavKey,
  practiceNavGroups,
  practiceNavLinks,
  type PracticeNavLink,
} from "./practice-nav";
import { focusRing } from "./styles";

export function PracticeSidebarNav({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const active = activeNavKey(usePathname());
  const idPrefix = useId();
  const renderLink = (link: PracticeNavLink) => {
    const current = link.key === active;
    return (
      <li key={link.key}>
        <Link
          aria-current={current ? "page" : undefined}
          aria-label={collapsed ? link.label : undefined}
          className={`flex min-h-11 items-center rounded-lg py-2 transition hover:text-[#df5a28] ${focusRing} ${current ? "bg-[#fff1ea] font-semibold text-[#df5a28]" : "text-[#4a4541]"} ${collapsed ? "justify-center px-1 text-[13px]" : "px-3 text-[15px]"}`}
          href={link.href}
          title={collapsed ? link.label : undefined}
        >
          {collapsed ? link.short : link.label}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Luyện tập"
      className={`flex flex-col ${collapsed ? "gap-4" : "gap-5"}`}
    >
      {practiceNavGroups.map((group) => (
        <div key={group.key}>
          <p
            className={`text-[13px] font-semibold text-[#2f2b28] ${collapsed ? "text-center text-[11px]" : "px-3"}`}
            id={`${idPrefix}-${group.key}`}
            title={collapsed ? group.label : undefined}
          >
            {collapsed ? (
              <>
                <span aria-hidden="true">{group.short}</span>
                <span className="sr-only">{group.label}</span>
              </>
            ) : (
              group.label
            )}
          </p>
          <ul
            aria-labelledby={`${idPrefix}-${group.key}`}
            className={`mt-1 flex flex-col gap-0.5 ${collapsed ? "" : "ml-3 border-l border-[#ece9e5] pl-1"}`}
          >
            {group.links.map(renderLink)}
          </ul>
        </div>
      ))}
      <ul className="flex flex-col gap-0.5 border-t border-[#ece9e5] pt-4">
        {practiceNavLinks.map(renderLink)}
      </ul>
    </nav>
  );
}

const storageKey = "toeicmaster.sidebar.collapsed";
const listeners = new Set<() => void>();

function readCollapsed() {
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(storageKey, value ? "1" : "0");
  } catch {}
  listeners.forEach((listener) => listener());
}

function Chevron({ flipped }: { flipped: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-3.5 transition-transform duration-200 ${flipped ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M10 3.5 5.5 8l4.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PracticeSidebar() {
  const navId = useId();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const toggle = useCallback(() => writeCollapsed(!collapsed), [collapsed]);

  return (
    <aside
      aria-label="Điều hướng luyện tập"
      className={`practice-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#ece9e5] bg-white transition-[width] duration-200 md:flex ${collapsed ? "w-16" : "w-60"}`}
      data-collapsed={collapsed ? "true" : "false"}
      data-testid="practice-sidebar"
    >
      <div
        className={`flex min-h-[73px] items-center border-b border-[#ece9e5] ${collapsed ? "justify-center px-2" : "px-5"}`}
      >
        <Link
          aria-label={collapsed ? "TOEICMaster, trang chủ" : undefined}
          className={`flex w-fit items-center gap-2 text-xl font-bold tracking-tight text-[#2f2b28] ${focusRing}`}
          href="/"
        >
          <BrandMark className="h-8 w-8 shrink-0" />
          {!collapsed && "TOEICMaster"}
        </Link>
      </div>
      <div
        className={`flex-1 overflow-y-auto py-5 ${collapsed ? "px-2" : "px-3"}`}
        id={navId}
      >
        <PracticeSidebarNav collapsed={collapsed} />
      </div>
      <button
        aria-controls={navId}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        className={`absolute right-0 top-1/2 grid size-7 -translate-y-1/2 translate-x-1/2 cursor-pointer place-items-center rounded-full border border-[#ece9e5] bg-white text-[#6b655f] shadow-sm transition hover:border-[#e9c6a4] hover:text-[#df5a28] ${focusRing}`}
        data-testid="practice-sidebar-toggle"
        onClick={toggle}
        title={collapsed ? "Mở rộng" : "Thu gọn"}
        type="button"
      >
        <Chevron flipped={collapsed} />
      </button>
    </aside>
  );
}
