import { NextRequest } from "next/server";
import { problem, sameOrigin } from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";
import { backendBase, readMultipart, relay } from "./upstream";

/** 1 MiB of audio plus room for the multipart envelope and text fields. */
export const maxAssessmentBytes = 1024 * 1024 + 64 * 1024;
const timeoutMs = 20_000;

/**
 * Forwards one recording to the backend pronunciation assessor. Without a
 * session the request still goes through so the backend decides (401 today).
 */
export async function forwardPronunciationAssessment(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Yêu cầu không hợp lệ.");

  const body = await readMultipart(request, maxAssessmentBytes);
  if (!body.ok) return body.response;

  const session = sessionCookie(request);
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": body.contentType,
  });
  if (session && Date.parse(session.refreshTokenExpiresAtUtc) > Date.now())
    headers.set("Authorization", `Bearer ${session.accessToken}`);

  let url: URL;
  try {
    url = new URL("/api/v1/pronunciation/assessments", backendBase());
  } catch {
    return problem(503, "Chưa chấm được phát âm lúc này.");
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: body.body,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return relay(upstream);
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError")
      return problem(504, "Hệ thống chấm phản hồi quá lâu.");
    return problem(502, "Chưa chấm được phát âm lúc này.");
  }
}
