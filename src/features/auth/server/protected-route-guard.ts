import { NextRequest, NextResponse } from "next/server";
import {
  isProtectedPath,
  protectedRoutePrefixes,
} from "@/features/auth/protected-routes";
import { sessionCookie } from "./session";

export function protectRoute(
  request: NextRequest,
  paths: readonly string[] = protectedRoutePrefixes,
) {
  if (!isProtectedPath(request.nextUrl.pathname, paths))
    return NextResponse.next();

  const session = sessionCookie(request);
  if (session && Date.parse(session.refreshTokenExpiresAtUtc) > Date.now())
    return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}
