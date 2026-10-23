import Link from "next/link";
import { UserMenu } from "@/features/user/components/user-menu";

export function WritingHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-4 px-5 sm:px-8">
        <Link
          className="text-lg font-extrabold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
          href="/"
        >
          TOEICMaster
        </Link>
        <nav
          aria-label="Luyện tập"
          className="hidden items-center gap-5 sm:flex"
        >
          <Link
            className="text-sm font-semibold text-orange-700 underline decoration-2 underline-offset-8"
            href="/writing"
          >
            Writing
          </Link>
          <Link
            className="text-sm font-medium text-slate-500 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-orange-600"
            href="/history/writing"
          >
            Lịch sử
          </Link>
        </nav>
        <div className="ml-auto">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
