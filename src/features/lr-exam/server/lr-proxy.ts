import { NextRequest, NextResponse } from "next/server";
import { problem, sameOrigin } from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";

const paths = [
  /^exams\/lr$/,
  /^exams\/[0-9a-f-]{36}\/lr-overview$/i,
  /^exams\/[0-9a-f-]{36}\/current-attempt$/i,
  /^exams\/[0-9a-f-]{36}\/attempts$/i,
  /^exam-attempts\/[0-9a-f-]{36}$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/(start-reading|submit|abandon)$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/answers$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/questions\/[0-9a-f-]{36}\/flag$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/(result|review|listening-audio-urls)$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/(audio|images)\/[0-9a-f-]{36}$/i,
  /^exam-attempts\/history$/i,

  // Learner Listening & Reading Practice
  /^lr-practice\/parts\/[1-7]\/items$/i,
  /^lr-practice\/parts\/[1-7]\/statistics$/i,
  /^lr-practice\/items\/[0-9a-f-]{36}$/i,
  /^lr-practice\/items\/[0-9a-f-]{36}\/submit$/i,
];

const getOnlyPaths = [
  /^exams\/lr$/,
  /^exams\/[0-9a-f-]{36}\/lr-overview$/i,
  /^exams\/[0-9a-f-]{36}\/current-attempt$/i,
  /^exam-attempts\/[0-9a-f-]{36}$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/(result|review|listening-audio-urls)$/i,
  /^exam-attempts\/[0-9a-f-]{36}\/(audio|images)\/[0-9a-f-]{36}$/i,
  /^exam-attempts\/history$/i,

  // Learner Listening & Reading Practice (GET-only)
  /^lr-practice\/parts\/[1-7]\/items$/i,
  /^lr-practice\/parts\/[1-7]\/statistics$/i,
  /^lr-practice\/items\/[0-9a-f-]{36}$/i,
];

function validPath(segments: string[]) {
  return paths.some((pattern) => pattern.test(segments.join("/")));
}

function isGetOnlyPath(segments: string[]) {
  return getOnlyPaths.some((pattern) => pattern.test(segments.join("/")));
}

export async function forwardLr(
  request: NextRequest,
  segments: string[],
  method: "GET" | "POST" | "PUT",
) {
  if (!validPath(segments)) {
    return problem(404, "Listening & Reading API endpoint not found.");
  }
  if (method !== "GET" && isGetOnlyPath(segments)) {
    return problem(405, "Method not allowed.");
  }
  if (method !== "GET" && !sameOrigin(request)) {
    return problem(403, "Invalid request.");
  }

  const path = segments.join("/");

  const isPublicCatalog = method === "GET" && path === "exams/lr";

  const isPublicPractice =
    method === "GET" &&
    (/^lr-practice\/parts\/[1-7]\/items$/i.test(path) ||
      /^lr-practice\/items\/[0-9a-f-]{36}$/i.test(path));

  const isPublic = isPublicCatalog || isPublicPractice;

  const session = sessionCookie(request);
  const hasValidRefresh =
    session !== null &&
    Date.parse(session.refreshTokenExpiresAtUtc) > Date.now();

  if (!isPublic && !hasValidRefresh) {
    return problem(401, "Please sign in to take the exam.");
  }

  const headers = new Headers({ Accept: "application/json" });

  if (
    hasValidRefresh &&
    Date.parse(session.accessTokenExpiresAtUtc) > Date.now()
  ) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  };

  if (method !== "GET") {
    const raw = await request.text();

    const bodyless =
      /^exams\/[0-9a-f-]{36}\/attempts$/i.test(path) ||
      /^exam-attempts\/[0-9a-f-]{36}\/(start-reading|submit|abandon)$/i.test(
        path,
      );

    if (raw) {
      if (
        !request.headers.get("content-type")?.startsWith("application/json")
      ) {
        return problem(400, "Invalid request payload.");
      }

      try {
        const parsed: unknown = JSON.parse(raw);

        if (parsed === null || typeof parsed !== "object") {
          return problem(400, "Invalid request payload.");
        }

        headers.set("Content-Type", "application/json");
        init.body = JSON.stringify(parsed);
      } catch {
        return problem(400, "Invalid request payload.");
      }
    } else if (!bodyless) {
      return problem(400, "Invalid request payload.");
    }
  }

  try {
    const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");

    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password
    ) {
      throw new Error("Invalid API_BASE_URL");
    }

    const url = new URL(`/api/v1/${path}`, base);
    url.search = new URL(request.url).search;

    const upstream = await fetch(url, init);

    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
    });

    const contentType = upstream.headers.get("content-type");

    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }

    const retryAfter = upstream.headers.get("retry-after");

    if (retryAfter) {
      responseHeaders.set("Retry-After", retryAfter);
    }

    return new NextResponse(upstream.status === 204 ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}
