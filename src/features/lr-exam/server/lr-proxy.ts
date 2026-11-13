import { NextRequest, NextResponse } from "next/server";
import { problem, sameOrigin } from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";

const paths = [
  /^exams\/lr$/,
  /^exams\/[0-9a-f-]{36}\/lr-overview$/i,
  /^exams\/[0-9a-f-]{36}\/attempts$/i,
  /^exam-attempts\/[0-9a-f-]{36}$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/(start-reading|submit)$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/answers$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/questions\/[0-9a-f-]{36}\/flag$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/(result|review)$/i,
  /^exam-attempts\/history$/i,
];

function validPath(segments: string[]) {
  return paths.some((pattern) => pattern.test(segments.join("/")));
}

export async function forwardLr(request: NextRequest, segments: string[], method: "GET" | "POST" | "PUT") {
  if (!validPath(segments)) return problem(404, "Không tìm thấy API Listening & Reading.");
  if (method !== "GET" && !sameOrigin(request)) return problem(403, "Yêu cầu không hợp lệ.");

  const session = sessionCookie(request);
  if (!session || Date.parse(session.refreshTokenExpiresAtUtc) <= Date.now())
    return problem(401, "Vui lòng đăng nhập để làm bài thi.");

  const headers = new Headers({ Accept: "application/json", Authorization: `Bearer ${session.accessToken}` });
  const init: RequestInit = { method, headers, cache: "no-store", signal: AbortSignal.timeout(10000) };

  if (method !== "GET") {
    const raw = await request.text();
    const bodyless = /^exam-attempts\/[0-9a-f-]{36}\/(start-reading|submit)$/i.test(segments.join("/"));
    if (raw) {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        return problem(400, "Dữ liệu yêu cầu không hợp lệ.");
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object") return problem(400, "Dữ liệu yêu cầu không hợp lệ.");
        headers.set("Content-Type", "application/json");
        init.body = JSON.stringify(parsed);
      } catch {
        return problem(400, "Dữ liệu yêu cầu không hợp lệ.");
      }
    } else if (!bodyless) {
      return problem(400, "Dữ liệu yêu cầu không hợp lệ.");
    }
  }

  try {
    const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
    if (!["http:", "https:"].includes(base.protocol) || base.username || base.password)
      throw new Error("Invalid API_BASE_URL");
    const url = new URL(`/api/v1/${segments.join("/")}`, base);
    url.search = new URL(request.url).search;
    const upstream = await fetch(url, init);
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) responseHeaders.set("Retry-After", retryAfter);
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
