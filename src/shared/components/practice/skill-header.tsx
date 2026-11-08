import Link from "next/link";
import type { ReactNode } from "react";
import { focusRing, pageContainer } from "./styles";

const navigation = [
  { id: "writing", label: "Writing", href: "/writing" },
  { id: "speaking", label: "Speaking", href: "/speaking" },
  { id: "history", label: "Lịch sử", href: "/history/writing" },
] as const;

export type PracticeNavId = (typeof navigation)[number]["id"];

export function SkillHeader({
  active,
  account,
}: {
  active: PracticeNavId;
  account: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div
        className={`${pageContainer} flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 py-2`}
      >
        <Link
          className={`flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900 ${focusRing}`}
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-red-600 to-orange-500 text-sm font-black text-white"
          >
            T
          </span>
          TOEICMaster
        </Link>
        <nav
          aria-label="Luyện tập"
          className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto"
        >
          {navigation.map((item) => {
            const current = item.id === active;
            return (
              <Link
                aria-current={current ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${focusRing} ${current ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                href={item.href}
                key={item.id}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">{account}</div>
      </div>
    </header>
  );
}
