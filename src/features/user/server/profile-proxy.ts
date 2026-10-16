import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  problem,
  sameOrigin,
} from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";

export async function forward(
  request: NextRequest,
  path: string,
  init: RequestInit,
): Promise<NextResponse> {
  const method = init.method ?? "GET";
  if (method !== "GET" && !sameOrigin(request))
    return problem(403, "Yêu cầu không hợp lệ.");

  try {
    const session = sessionCookie(request);
    if (
      !session ||
      Date.parse(session.refreshTokenExpiresAtUtc) <= Date.now()
    ) {
      return problem(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    }
    const upstream = await backendFetch(path, session.accessToken, init);
    if (upstream.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    const headers = new Headers({
      "Cache-Control": contentType.startsWith("image/")
        ? "private, no-store"
        : "no-store",
    });
    if (contentType) headers.set("Content-Type", contentType);
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) headers.set("Retry-After", retryAfter);

    if (contentType.startsWith("image/")) {
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers,
      });
    }

    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers,
    });
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
