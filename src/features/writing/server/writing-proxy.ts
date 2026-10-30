import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { problem, sameOrigin } from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";

const anonymousCookieName = "toeicmaster_writing_anonymous";
const anonymousHeaderName = "X-Writing-Anonymous-Session";
const knownPaths = [
  /^tests$/,
  /^tests\/[0-9a-f-]{36}$/i,
  /^media\/[0-9a-f-]{36}$/i,
  /^attempts$/,
  /^attempts\/[0-9a-f-]{36}$/i,
  /^attempts\/[0-9a-f-]{36}\/next$/i,
  /^attempts\/[0-9a-f-]{36}\/submit$/i,
  /^attempts\/[0-9a-f-]{36}\/evaluation-consent$/i,
  /^attempts\/[0-9a-f-]{36}\/answers\/[1-9]\d*$/i,
];

function validPath(segments: string[]) {
  return knownPaths.some((pattern) => pattern.test(segments.join("/")));
}

function upstreamResponse(response: Response, anonymousSession: string | null) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = response.headers.get("content-type");
  const retryAfter = response.headers.get("retry-after");
  if (contentType) headers.set("Content-Type", contentType);
  if (retryAfter) headers.set("Retry-After", retryAfter);
  const result = new NextResponse(response.body, {
    status: response.status,
    headers,
  });
  if (anonymousSession)
    result.cookies.set(anonymousCookieName, anonymousSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  return result;
}

function backendUrl(path: string) {
  const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new Error("Invalid API_BASE_URL");
  return new URL(`/api/v1/writing/${path}`, base);
}

export async function forwardWriting(
  request: NextRequest,
  segments: string[],
  method: "GET" | "POST" | "PUT",
) {
  if (!validPath(segments)) return problem(404, "Không tìm thấy API Writing.");
  if (method !== "GET" && !sameOrigin(request))
    return problem(403, "Yêu cầu không hợp lệ.");

  const path = segments.join("/");
  const isAttemptPath = path === "attempts" || path.startsWith("attempts/");
  const session = sessionCookie(request);
  const accessToken =
    session && Date.parse(session.refreshTokenExpiresAtUtc) > Date.now()
      ? session.accessToken
      : null;
  let anonymousSession: string | null = null;
  if (isAttemptPath && !accessToken) {
    const cookie = request.cookies.get(anonymousCookieName)?.value;
    anonymousSession = /^[0-9a-f-]{36}$/i.test(cookie ?? "")
      ? cookie!
      : randomUUID();
  }

  const headers = new Headers({ Accept: "application/json" });
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (anonymousSession) headers.set(anonymousHeaderName, anonymousSession);
  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  };
  if (method !== "GET") {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return problem(400, "Dữ liệu yêu cầu không hợp lệ.");
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return problem(400, "Dữ liệu yêu cầu không hợp lệ.");
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }

  try {
    return upstreamResponse(
      await fetch(backendUrl(path), init),
      anonymousSession,
    );
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
