import { NextRequest, NextResponse } from "next/server";
import { sessionCookie } from "@/features/auth/server/session";

export async function GET(request: NextRequest) {
  const session = sessionCookie(request);
  const state =
    !session || Date.parse(session.refreshTokenExpiresAtUtc) <= Date.now()
      ? { status: "guest" }
      : Date.parse(session.accessTokenExpiresAtUtc) <= Date.now() + 30_000
        ? { status: "refresh_required" }
        : { status: "authenticated", user: session.user };
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}
