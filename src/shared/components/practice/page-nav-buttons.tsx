"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { hasPreviousVisit, parentPath } from "./navigation-history";
import { focusRing } from "./styles";

const button = `inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-slate-300 bg-white pl-2.5 pr-3 text-[13px] font-medium leading-none whitespace-nowrap text-slate-700 transition hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 ${focusRing}`;

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function goBack(event: MouseEvent) {
  // Opened directly, or in a new tab: the link's own target is the parent page.
  if (event.metaKey || event.ctrlKey || event.shiftKey || !hasPreviousVisit())
    return;
  event.preventDefault();
  window.history.back();
}

/** Lets learners move around without editing the address bar. */
export function PageNavButtons() {
  const pathname = usePathname() ?? "/";
  return (
    <div className="flex items-center gap-2">
      <Link className={button} href={parentPath(pathname)} onClick={goBack}>
        <NavIcon>
          <path d="m12 19-7-7 7-7M19 12H5" />
        </NavIcon>
        Quay lại
      </Link>
      <Link className={button} href="/">
        <NavIcon>
          <path d="m3 10.5 9-7.5 9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9.5Z" />
        </NavIcon>
        Trang chủ
      </Link>
    </div>
  );
}
