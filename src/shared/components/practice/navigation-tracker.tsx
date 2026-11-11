"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackVisit } from "./navigation-history";

/** Records in-app page changes so the back button knows if it can stay in the app. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) trackVisit(pathname);
  }, [pathname]);
  return null;
}
