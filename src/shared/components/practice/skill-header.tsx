import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/features/user/components/brand-mark";
import { HeaderMenu } from "./header-menu";
import { PracticeSidebar, PracticeSidebarNav } from "./practice-sidebar";
import { focusRing, pageContainer, wideContainer } from "./styles";

export type PracticeNavId =
  | "listening-reading"
  | "listening"
  | "reading"
  | "speaking"
  | "writing"
  | "pronunciation"
  | "history";

/**
 * Top bar of the learner pages plus the left sidebar that holds the
 * navigation. The highlighted sidebar entry follows the URL, so `active` is
 * kept only for callers that still pass it.
 */
export function SkillHeader({
  account,
  wide = false,
  center,
}: {
  active?: PracticeNavId;
  account: ReactNode;
  wide?: boolean;
  /** Title shown in the bar, e.g. of a read-only review. */
  center?: ReactNode;
}) {
  return (
    <>
      <PracticeSidebar />
      <header className="sticky top-0 z-50 border-b border-[#ece9e5] bg-white">
        <div
          className={`${wide ? wideContainer : pageContainer} grid min-h-[72px] grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-2`}
        >
          <Link
            className={`flex w-fit items-center gap-2 text-xl font-bold tracking-tight text-[#2f2b28] md:hidden ${focusRing}`}
            href="/"
          >
            <BrandMark className="h-8 w-8" />
            TOEICMaster
          </Link>
          {center ? (
            <div className="order-last col-span-2 min-w-0 md:order-none md:col-span-1">
              {center}
            </div>
          ) : (
            <span aria-hidden="true" className="hidden md:block" />
          )}
          <HeaderMenu>
            <div className="md:hidden">
              <PracticeSidebarNav />
            </div>
            <div className="border-t border-[#ece9e5] pt-5 md:justify-self-end md:border-0 md:pt-0">
              {account}
            </div>
          </HeaderMenu>
        </div>
      </header>
    </>
  );
}
