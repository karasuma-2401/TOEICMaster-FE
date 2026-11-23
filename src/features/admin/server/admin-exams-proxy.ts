import { NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  problem,
  sameOrigin,
} from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";

type AdminExamMethod = "GET" | "POST" | "PUT" | "DELETE";

function upstreamResponse(response: Response) {
  if (response.status === 204)
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });

  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = response.headers.get("content-type");
  const contentDisposition = response.headers.get("content-disposition");
  const retryAfter = response.headers.get("retry-after");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentDisposition)
    headers.set("Content-Disposition", contentDisposition);
  if (retryAfter) headers.set("Retry-After", retryAfter);
  return new NextResponse(response.body, { status: response.status, headers });
}

export async function forwardAdminExamRequest(
  request: NextRequest,
  path: string,
  method: AdminExamMethod,
  maximumMultipartBytes?: number,
) {
  if (method !== "GET" && !sameOrigin(request))
    return problem(403, "Invalid request.");

  const session = sessionCookie(request);
  if (!session || Date.parse(session.refreshTokenExpiresAtUtc) <= Date.now())
    return problem(401, "Invalid or expired session.");

  if (session.role !== "ADMIN")
    return problem(403, "You do not have permission to access this feature.");

  const init: RequestInit = { method };
  if (method !== "GET" && method !== "DELETE") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.startsWith("application/json")) {
      const body: unknown = await request.json().catch(() => null);
      if (!body || typeof body !== "object" || Array.isArray(body))
        return problem(400, "Invalid request data.");
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    } else if (contentType.startsWith("multipart/form-data")) {
      const declaredLength = Number(request.headers.get("content-length"));
      if (
        maximumMultipartBytes !== undefined &&
        (!Number.isFinite(declaredLength) ||
          declaredLength > maximumMultipartBytes)
      )
        return problem(413, "Uploaded file exceeds the allowed size limit.");
      const formData = await request.formData().catch(() => null);
      if (!formData) return problem(400, "Invalid file data.");
      if (maximumMultipartBytes !== undefined) {
        const fileBytes = [...formData.values()].reduce(
          (total, value) => total + (value instanceof File ? value.size : 0),
          0,
        );
        if (fileBytes > maximumMultipartBytes)
          return problem(413, "Uploaded file exceeds the allowed size limit.");
      }
      init.body = formData;
    } else {
      return problem(400, "Invalid request data.");
    }
  }

  try {
    return upstreamResponse(
      await backendFetch(path, session.accessToken, init),
    );
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}
