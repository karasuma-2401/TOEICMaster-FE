import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/features/user/components/brand-mark";
import { HeaderMenu } from "./header-menu";
import { focusRing, pageContainer, wideContainer } from "./styles";

// Each skill page has its own switch between tests and exercises.
const navigation = [
  { id: "listening", label: "Listening", href: "/listening" },
  { id: "reading", label: "Reading", href: "/reading" },
  { id: "speaking", label: "Speaking", href: "/speaking" },
  { id: "writing", label: "Writing", href: "/writing" },
  { id: "history", label: "Lịch sử", href: "/history/writing" },
] as const;

export type PracticeNavId = (typeof navigation)[number]["id"];

export function SkillHeader({
  active,
  account,
  wide = false,
  center,
}: {
  active?: PracticeNavId;
  account: ReactNode;
  wide?: boolean;
  /** Replaces the navigation, e.g. with the title of a read-only review. */
  center?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#ece9e5] bg-white">
      <div
        className={`${wide ? wideContainer : pageContainer} grid min-h-[72px] grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-2 lg:grid-cols-[1fr_auto_1fr]`}
      >
        <Link
          className={`flex w-fit items-center gap-2 text-xl font-bold tracking-tight text-[#2f2b28] ${focusRing}`}
          href="/"
        >
          <BrandMark className="h-8 w-8" />
          TOEICMaster
        </Link>
        {center && (
          <div className="order-last col-span-2 min-w-0 lg:order-none lg:col-span-1">
            {center}
          </div>
        )}
        <HeaderMenu>
          <div
            className={`min-w-0 md:order-last md:col-span-2 lg:order-none lg:col-span-1 ${center ? "md:hidden" : ""}`}
          >
            <nav
              aria-label="Luyện tập"
              className="flex flex-col gap-1 md:flex-row md:overflow-x-auto"
            >
              {navigation.map((item) => {
                const current = item.id === active;
                return (
                  <Link
                    aria-current={current ? "page" : undefined}
                    className={`whitespace-nowrap rounded-lg px-3.5 py-3 text-base transition hover:text-[#df5a28] md:py-2 md:text-[15px] ${focusRing} ${current ? "bg-[#fff1ea] font-semibold text-[#df5a28] md:bg-transparent" : "text-[#4a4541]"}`}
                    href={item.href}
                    key={item.id}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="border-t border-[#ece9e5] pt-5 md:justify-self-end md:border-0 md:pt-0">
            {account}
          </div>
        </HeaderMenu>
      </div>
    </header>
  );
}
