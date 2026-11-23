import { NextRequest, NextResponse } from "next/server";
import { problem } from "@/features/auth/server/backend";

// Own copy of the few upstream helpers this feature needs, so Pronunciation
// does not depend on the Speaking feature's server code.

export function backendBase() {
  const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  ) {
    throw new Error("Invalid API_BASE_URL");
  }
  return base;
}

export type MultipartBody =
  | { ok: true; body: ArrayBuffer; contentType: string }
  | { ok: false; response: NextResponse };

/** Reads a multipart body, refusing it when it exceeds `limit` bytes. */
export async function readMultipart(
  request: NextRequest,
  limit: number,
): Promise<MultipartBody> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data"))
    return {
      ok: false,
      response: problem(400, "Recording must be sent as multipart form data."),
    };
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > limit)
    return {
      ok: false,
      response: problem(413, "Recording exceeds the size limit."),
    };
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader) {
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > limit) {
          void reader.cancel().catch(() => {});
          return {
            ok: false,
            response: problem(413, "Recording exceeds the size limit."),
          };
        }
        if (value.byteLength > 0) chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  const body = new ArrayBuffer(total);
  const bytes = new Uint8Array(body);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, body, contentType };
}

/** Copies the status, safe headers and body of the backend response. */
export function relay(response: Response) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = response.headers.get("content-type");
  const retryAfter = response.headers.get("retry-after");
  if (contentType) headers.set("Content-Type", contentType);
  if (retryAfter) headers.set("Retry-After", retryAfter);
  return new NextResponse(response.status === 204 ? null : response.body, {
    status: response.status,
    headers,
  });
}
