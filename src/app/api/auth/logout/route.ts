import { NextRequest, NextResponse } from "next/server";
import { postAuth, problem, sameOrigin } from "@/features/auth/server/backend";
import {
  clearSessionCookie,
  sessionCookie,
} from "@/features/auth/server/session";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Yêu cầu không hợp lệ.");
  const current = sessionCookie(request);
  if (current) {
    try {
      const upstream = await postAuth("logout", {
        refreshToken: current.refreshToken,
      });
      if (upstream.status !== 204) throw new Error("Unexpected logout status");
    } catch {
      return problem(502, "Không thể đăng xuất. Vui lòng thử lại.");
    }
  }
  const response = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
  clearSessionCookie(response);
  return response;
}
