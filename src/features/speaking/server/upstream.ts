import { NextRequest, NextResponse } from "next/server";
import { problem } from "@/features/auth/server/backend";
import {
  readBoundedJson,
  readMultipartStream,
} from "@/shared/server/bff-proxy";

const binaryTypes = /^(image|audio)\//;

/** Copies status, safe headers and body from the backend response. */
export function relay(response: Response) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = response.headers.get("content-type");
  const retryAfter = response.headers.get("retry-after");
  if (contentType) headers.set("Content-Type", contentType);
  if (retryAfter) headers.set("Retry-After", retryAfter);
  if (contentType && binaryTypes.test(contentType)) {
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    const length = response.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
  }
  return new NextResponse(response.status === 204 ? null : response.body, {
    status: response.status,
    headers,
  });
}

export type ForwardBody =
  | { ok: true; body?: BodyInit; contentType?: string }
  | { ok: false; response: NextResponse };

/** Upper bound for Speaking JSON bodies (admin exercise/test drafts included). */
export const jsonBodyLimit = 1024 * 1024;

/**
 * Reads a JSON object or a size-limited multipart body for forwarding.
 * `multipart` is the byte limit when the route accepts uploads.
 *
 * Both paths stream through the shared bounded readers in
 * `@/shared/server/bff-proxy`, so an oversized body is cancelled as soon as it
 * crosses the cap instead of being drained into memory first.
 */
export async function readForwardBody(
  request: NextRequest,
  multipart: number | null,
): Promise<ForwardBody> {
  const contentType = request.headers.get("content-type") ?? "";
  if (multipart !== null) {
    if (!contentType.startsWith("multipart/form-data"))
      return {
        ok: false,
        response: problem(400, "File must be sent as multipart form data."),
      };
    const result = await readMultipartStream(
      request,
      multipart,
      "File exceeds the allowed size limit.",
    );
    if (result instanceof Response)
      return {
        ok: false,
        response:
          result instanceof NextResponse
            ? result
            : problem(result.status, "Invalid request payload."),
      };
    return { ok: true, body: result.body, contentType: result.contentType };
  }
  if (!contentType) return { ok: true };
  if (!contentType.startsWith("application/json"))
    return {
      ok: false,
      response: problem(400, "Invalid request payload."),
    };
  const parsed = await readBoundedJson(request, jsonBodyLimit, {
    oversizeMessage: "Request payload exceeds the size limit.",
    invalidMessage: "Invalid request payload.",
  });
  if (!parsed.ok) return { ok: false, response: parsed.response };
  const value = parsed.data;
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {
      ok: false,
      response: problem(400, "Invalid request payload."),
    };
  return {
    ok: true,
    body: JSON.stringify(value),
    contentType: "application/json",
  };
}
