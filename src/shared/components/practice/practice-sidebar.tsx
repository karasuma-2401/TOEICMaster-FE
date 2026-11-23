"use client";

import {
  AudioLines,
  BookOpen,
  ChevronLeft,
  Headphones,
  History,
  Layers,
  Mic,
  Pencil,
  SquarePen,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useId, useSyncExternalStore } from "react";
import { BrandMark } from "@/features/user/components/brand-mark";
import {
  activeNavKey,
  practiceNavGroups,
  practiceNavLinks,
  type PracticeNavKey,
  type PracticeNavLink,
} from "./practice-nav";
import { focusRing } from "./styles";

const navIcons: Record<PracticeNavKey, LucideIcon> = {
  knowledge: BookOpen,
  "exam-lr": Headphones,
  "exam-speaking": Mic,
  "exam-writing": Pencil,
  "exercise-lr": BookOpen,
  "exercise-speaking": AudioLines,
  "exercise-writing": SquarePen,
  flashcards: Layers,
  pronunciation: Volume2,
  history: History,
};

export function PracticeSidebarNav({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const active = activeNavKey(usePathname());
  const idPrefix = useId();
  const renderLink = (link: PracticeNavLink, groupLabel?: string) => {
    const current = link.key === active;
    const Icon = navIcons[link.key];
    const tooltip = groupLabel ? `${groupLabel} · ${link.label}` : link.label;
    return (
      <li key={link.key}>
        <Link
          aria-current={current ? "page" : undefined}
          aria-label={collapsed ? link.label : undefined}
          className={`flex min-h-11 items-center rounded-lg py-2 transition hover:text-[#df5a28] ${focusRing} ${current ? "bg-[#fff1ea] font-semibold text-[#df5a28]" : "text-[#4a4541] hover:bg-[#faf7f5]"} ${collapsed ? "justify-center px-0" : "gap-2.5 px-3 text-[15px]"}`}
          href={link.href}
          title={collapsed ? tooltip : undefined}
        >
          <Icon
            aria-hidden="true"
            className="size-[18px] shrink-0"
            strokeWidth={1.75}
          />
          {!collapsed && <span className="truncate">{link.label}</span>}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Practice"
      className={`flex flex-col ${collapsed ? "gap-3" : "gap-5"}`}
    >
      {practiceNavGroups.map((group, index) => (
        <div
          className={
            collapsed && index > 0
              ? "border-t border-[#ece9e5] pt-3"
              : undefined
          }
          key={group.key}
        >
          <p
            className={
              collapsed
                ? "sr-only"
                : "px-3 text-[13px] font-semibold text-[#2f2b28]"
            }
            id={`${idPrefix}-${group.key}`}
          >
            {group.label}
          </p>
          <ul
            aria-labelledby={`${idPrefix}-${group.key}`}
            className={`flex flex-col ${collapsed ? "gap-1" : "mt-1 ml-3 gap-0.5 border-l border-[#ece9e5] pl-1"}`}
          >
            {group.links.map((link) => renderLink(link, group.label))}
          </ul>
        </div>
      ))}
      <ul
        className={`flex flex-col border-t border-[#ece9e5] ${collapsed ? "gap-1 pt-3" : "gap-0.5 pt-4"}`}
      >
        {practiceNavLinks.map((link) => renderLink(link))}
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

export function PracticeSidebar() {
  const navId = useId();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const toggle = useCallback(() => writeCollapsed(!collapsed), [collapsed]);

  return (
    <aside
      aria-label="Practice navigation"
      className={`practice-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#ece9e5] bg-white transition-[width] duration-200 md:flex ${collapsed ? "w-16" : "w-60"}`}
      data-collapsed={collapsed ? "true" : "false"}
      data-testid="practice-sidebar"
    >
      <div
        className={`flex min-h-[73px] items-center border-b border-[#ece9e5] ${collapsed ? "justify-center px-2" : "px-5"}`}
      >
        <Link
          aria-label={collapsed ? "TOEICMaster, home" : undefined}
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
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`absolute right-0 top-1/2 grid size-7 -translate-y-1/2 translate-x-1/2 cursor-pointer place-items-center rounded-full border border-[#ece9e5] bg-white text-[#6b655f] shadow-sm transition hover:border-[#e9c6a4] hover:text-[#df5a28] ${focusRing}`}
        data-testid="practice-sidebar-toggle"
        onClick={toggle}
        title={collapsed ? "Expand" : "Collapse"}
        type="button"
      >
        <ChevronLeft
          aria-hidden="true"
          className={`size-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
    </aside>
  );
}
