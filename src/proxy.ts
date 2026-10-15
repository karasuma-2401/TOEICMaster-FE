import type { NextRequest } from "next/server";
import { protectRoute } from "@/features/auth/server/protected-route-guard";

export function proxy(request: NextRequest) {
  return protectRoute(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
