import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { problem } from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";
import { forwardBffRequest } from "@/shared/server/bff-proxy";

const anonymousCookieName = "toeicmaster_writing_anonymous";
const anonymousHeaderName = "X-Writing-Anonymous-Session";
/** JSON payload cap for learner Writing endpoints (answers, attempt creation, consent). */
export const writingJsonBodyLimit = 256 * 1024;

const knownPaths = [
  /^tests$/,
  /^exercises$/,
  /^exercises\/[0-9a-f-]{36}\/attempts$/i,
  /^tests\/[0-9a-f-]{36}$/i,
  /^media\/[0-9a-f-]{36}$/i,
  /^attempts$/,
  /^attempts\/[0-9a-f-]{36}$/i,
  /^attempts\/[0-9a-f-]{36}\/next$/i,
  /^attempts\/[0-9a-f-]{36}\/submit$/i,
  /^attempts\/[0-9a-f-]{36}\/evaluation-consent$/i,
  /^attempts\/[0-9a-f-]{36}\/answers\/[1-9]\d*$/i,
  /^attempts\/[0-9a-f-]{36}\/media\/[0-9a-f-]{36}$/i,
];

function validPath(segments: string[]) {
  return knownPaths.some((pattern) => pattern.test(segments.join("/")));
}

export async function forwardWriting(
  request: NextRequest,
  segments: string[],
  method: "GET" | "POST" | "PUT",
) {
  if (!validPath(segments))
    return problem(404, "Writing API endpoint not found.");

  const path = segments.join("/");
  const isAttemptPath =
    path === "attempts" ||
    path.startsWith("attempts/") ||
    /^exercises\/[0-9a-f-]{36}\/attempts$/i.test(path);
  const session = sessionCookie(request);
  const hasSignedInSession =
    session !== null &&
    Date.parse(session.refreshTokenExpiresAtUtc) > Date.now();
  let anonymousSession: string | null = null;
  if (isAttemptPath && !hasSignedInSession) {
    const cookie = request.cookies.get(anonymousCookieName)?.value;
    anonymousSession = /^[0-9a-f-]{36}$/i.test(cookie ?? "")
      ? cookie!
      : randomUUID();
  }

  const acceptsEmptyBody = /^attempts\/[0-9a-f-]{36}\/(next|submit)$/i.test(
    path,
  );
  const search = new URL(request.url).search;
  const response = await forwardBffRequest(request, {
    upstreamPath: `/api/v1/writing/${path}${search}`,
    method,
    auth: "optional",
    bodyMode:
      method === "GET" ? "none" : acceptsEmptyBody ? "optional-json" : "json",
    maxBodyBytes: writingJsonBodyLimit,
    timeoutMs: 10_000,
    ...(anonymousSession
      ? { extraHeaders: { [anonymousHeaderName]: anonymousSession } }
      : {}),
    unreachableMessage: "Service unavailable. Please try again later.",
  });

  if (anonymousSession && response instanceof NextResponse) {
    response.cookies.set(anonymousCookieName, anonymousSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}
