import { NextRequest, NextResponse } from "next/server";
import { problem, sameOrigin } from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";

const GUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const SLUG_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";

const DECKS_ROOT = /^decks$/i;
const DECK_BY_SLUG = new RegExp(`^decks/${SLUG_PATTERN}$`, "i");
const DECK_BY_ID = new RegExp(`^decks/${GUID_PATTERN}$`, "i");
const DECK_CARDS = new RegExp(`^decks/${GUID_PATTERN}/cards$`, "i");
const DECK_MATCH_RECORDS = new RegExp(
  `^decks/${GUID_PATTERN}/match-records$`,
  "i",
);
const DECK_PROGRESS = new RegExp(`^decks/${GUID_PATTERN}/progress$`, "i");
const CARD_PROGRESS = new RegExp(`^cards/${GUID_PATTERN}/progress$`, "i");

type FlashcardMethod = "GET" | "POST" | "PUT" | "DELETE";

function isAllowedMethodForPath(
  path: string,
  method: FlashcardMethod,
): boolean {
  if (DECKS_ROOT.test(path)) return method === "GET" || method === "POST";
  if (DECK_BY_ID.test(path)) return method === "DELETE";
  if (DECK_BY_SLUG.test(path)) return method === "GET";
  if (DECK_CARDS.test(path)) return method === "POST";
  if (DECK_MATCH_RECORDS.test(path)) return method === "POST";
  if (DECK_PROGRESS.test(path)) return method === "DELETE";
  if (CARD_PROGRESS.test(path)) return method === "PUT";
  return false;
}

function isKnownPath(path: string): boolean {
  return (
    DECKS_ROOT.test(path) ||
    DECK_BY_ID.test(path) ||
    DECK_BY_SLUG.test(path) ||
    DECK_CARDS.test(path) ||
    DECK_MATCH_RECORDS.test(path) ||
    DECK_PROGRESS.test(path) ||
    CARD_PROGRESS.test(path)
  );
}

export async function forwardFlashcards(
  request: NextRequest,
  segments: string[],
  method: FlashcardMethod,
) {
  const path = segments.join("/");

  if (!isKnownPath(path)) {
    return problem(404, "Flashcards API endpoint not found.");
  }

  if (!isAllowedMethodForPath(path, method)) {
    return problem(405, "Method not allowed.");
  }

  if (method !== "GET" && !sameOrigin(request)) {
    return problem(403, "Invalid request.");
  }

  const isPublic =
    method === "GET" && (DECKS_ROOT.test(path) || DECK_BY_SLUG.test(path));
  const session = sessionCookie(request);
  const now = Date.now();
  const hasValidRefresh =
    session !== null && Date.parse(session.refreshTokenExpiresAtUtc) > now;
  const hasValidAccess =
    session !== null && Date.parse(session.accessTokenExpiresAtUtc) > now;

  if (!isPublic && !hasValidRefresh) {
    return problem(401, "Please sign in to sync Flashcards.");
  }

  // When an authenticated session exists with an expired access token, return 401
  // so the client refreshes the token instead of silently downgrading to guest data.
  if (hasValidRefresh && !hasValidAccess) {
    return problem(401, "Your session has expired. Please refresh.");
  }

  const headers = new Headers({ Accept: "application/json" });
  if (hasValidRefresh && hasValidAccess) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  };

  if (method === "POST" || method === "PUT") {
    const raw = await request.text();
    if (!raw) {
      return problem(400, "Invalid request payload.");
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
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

    const url = new URL(`/api/v1/flashcards/${path}`, base);
    url.search = new URL(request.url).search;

    const upstream = await fetch(url, init);
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }

    return new NextResponse(upstream.status === 204 ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return problem(
      502,
      "Flashcards service is unavailable. Please try again later.",
    );
  }
}
