import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  problem,
  sameOrigin,
} from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";

function upstreamResponse(response: Response) {
  if (response.status === 204)
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });

  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = response.headers.get("content-type");
  const retryAfter = response.headers.get("retry-after");
  if (contentType) headers.set("Content-Type", contentType);
  if (retryAfter) headers.set("Retry-After", retryAfter);
  return new NextResponse(response.body, { status: response.status, headers });
}

export async function forwardAdminUsers(
  request: NextRequest,
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
) {
  if (method !== "GET" && !sameOrigin(request))
    return problem(403, "Invalid request.");

  const session = sessionCookie(request);
  if (!session || Date.parse(session.refreshTokenExpiresAtUtc) <= Date.now())
    return problem(401, "Invalid or expired session.");

  const role = (session as typeof session & { role?: unknown }).role;
  if (role !== "ADMIN")
    return problem(403, "You do not have permission to access this feature.");

  const init: RequestInit = { method };
  const contentType = request.headers.get("content-type") ?? "";
  const bodyRequired =
    method === "PATCH" || (method === "POST" && path === "/api/v1/admin/users");
  if (bodyRequired && !contentType.startsWith("application/json"))
    return problem(400, "Invalid request data.");
  if (contentType.startsWith("application/json")) {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return problem(400, "Invalid request data.");
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  try {
    const upstream = await backendFetch(path, session.accessToken, init);
    return upstreamResponse(upstream);
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}

export function adminUserPath(id: string, action?: "lock" | "reset-password") {
  const userPath = `/api/v1/admin/users/${encodeURIComponent(id)}`;
  return action ? `${userPath}/${action}` : userPath;
}
