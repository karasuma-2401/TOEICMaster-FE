"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/features/user/components/user-menu";
import { PageNavButtons } from "@/shared/components/practice/page-nav-buttons";
import { SpeakingLogo } from "./ui/primitives";

const links = [
  {
    label: "Luyện tập theo Part",
    href: "/speaking/parts/1",
    active: (path: string) =>
      path.startsWith("/speaking/parts") ||
      path.startsWith("/speaking/exercises"),
  },
  {
    label: "Đề thi thử ETS",
    href: "/speaking",
    active: (path: string) =>
      !path.startsWith("/speaking/parts") &&
      !path.startsWith("/speaking/exercises"),
  },
];

export function SpeakingHeader() {
  const pathname = usePathname() ?? "";
  return (
    <header className="sticky top-0 z-30 border-b border-(--sp-line) bg-(--sp-surface)">
      <div className="relative flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 md:px-6">
        <div className="flex items-center gap-4">
          <SpeakingLogo />
          <PageNavButtons />
        </div>
        <nav
          aria-label="Speaking"
          className="order-last flex w-full justify-center gap-10 text-[15px] xl:absolute xl:left-1/2 xl:order-none xl:w-auto xl:-translate-x-1/2"
        >
          {links.map((link) => {
            const current = link.active(pathname);
            return (
              <Link
                aria-current={current ? "page" : undefined}
                className={`sp-focus whitespace-nowrap ${current ? "font-semibold text-(--sp-brand)" : "text-(--sp-ink)"}`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}
