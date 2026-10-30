import { NextRequest, NextResponse } from "next/server";
import { problem } from "@/features/auth/server/backend";

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

/**
 * Reads a JSON object or a size-limited multipart body for forwarding.
 * `multipart` is the byte limit when the route accepts uploads.
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
        response: problem(400, "Cần gửi file dạng multipart."),
      };
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > multipart)
      return {
        ok: false,
        response: problem(413, "File vượt quá giới hạn cho phép."),
      };
    const body = await request.arrayBuffer();
    if (body.byteLength > multipart)
      return {
        ok: false,
        response: problem(413, "File vượt quá giới hạn cho phép."),
      };
    return { ok: true, body, contentType };
  }
  if (!contentType) return { ok: true };
  if (!contentType.startsWith("application/json"))
    return {
      ok: false,
      response: problem(400, "Dữ liệu yêu cầu không hợp lệ."),
    };
  const value: unknown = await request.json().catch(() => null);
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {
      ok: false,
      response: problem(400, "Dữ liệu yêu cầu không hợp lệ."),
    };
  return {
    ok: true,
    body: JSON.stringify(value),
    contentType: "application/json",
  };
}

export function backendBase() {
  const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new Error("Invalid API_BASE_URL");
  return base;
}
