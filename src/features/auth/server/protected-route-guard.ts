import { NextRequest, NextResponse } from "next/server";
import {
  isProtectedPath,
  protectedRoutePrefixes,
} from "@/features/auth/protected-routes";
import { sessionCookie } from "./session";
import { isAdminPreviewEnabled } from "@/features/admin/server/admin-preview";

export function protectRoute(
  request: NextRequest,
  paths: readonly string[] = protectedRoutePrefixes,
) {
  if (!isProtectedPath(request.nextUrl.pathname, paths))
    return NextResponse.next();

  const isAdminPath =
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname.startsWith("/admin/");
  if (isAdminPath && isAdminPreviewEnabled()) return NextResponse.next();
  const session = sessionCookie(request);
  if (session && Date.parse(session.refreshTokenExpiresAtUtc) > Date.now()) {
    if (isAdminPath) {
      if (session.role !== "ADMIN")
        return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}
