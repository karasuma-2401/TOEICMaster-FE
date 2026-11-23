import { NextRequest, NextResponse } from "next/server";
import { problem, sameOrigin } from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";
import { isGuid } from "@/shared/lib/guards";

const DECK_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

type FlashcardMethod = "GET" | "POST" | "PUT" | "DELETE";
type FlashcardRoute =
  | "decks"
  | "deck-by-id"
  | "deck-by-slug"
  | "deck-cards"
  | "deck-match-records"
  | "deck-progress"
  | "card-progress";

const ROUTE_METHODS: Record<FlashcardRoute, readonly FlashcardMethod[]> = {
  decks: ["GET", "POST"],
  "deck-by-id": ["DELETE"],
  "deck-by-slug": ["GET"],
  "deck-cards": ["POST"],
  "deck-match-records": ["POST"],
  "deck-progress": ["DELETE"],
  "card-progress": ["PUT"],
};

function classifyPath(segments: string[]): FlashcardRoute | null {
  const [resource, identifier, action] = segments;
  const resourceName = resource?.toLowerCase();
  if (segments.length === 1 && resourceName === "decks") return "decks";
  if (segments.length === 2 && resourceName === "decks") {
    if (isGuid(identifier)) return "deck-by-id";
    return DECK_SLUG.test(identifier) ? "deck-by-slug" : null;
  }
  if (segments.length !== 3 || !isGuid(identifier)) return null;
  const actionName = action.toLowerCase();
  if (resourceName === "cards" && actionName === "progress") {
    return "card-progress";
  }
  if (resourceName !== "decks") return null;
  if (actionName === "cards") return "deck-cards";
  if (actionName === "match-records") return "deck-match-records";
  if (actionName === "progress") return "deck-progress";
  return null;
}

export async function forwardFlashcards(
  request: NextRequest,
  segments: string[],
  method: FlashcardMethod,
) {
  const path = segments.join("/");
  const route = classifyPath(segments);

  if (!route) {
    return problem(404, "Flashcards API endpoint not found.");
  }

  if (!ROUTE_METHODS[route].includes(method)) {
    return problem(405, "Method not allowed.");
  }

  if (method !== "GET" && !sameOrigin(request)) {
    return problem(403, "Invalid request.");
  }

  const isPublic =
    method === "GET" && (route === "decks" || route === "deck-by-slug");
  const session = sessionCookie(request);
  const hasValidRefresh =
    session !== null &&
    Date.parse(session.refreshTokenExpiresAtUtc) > Date.now();

  if (!isPublic && !hasValidRefresh) {
    return problem(401, "Please sign in to sync Flashcards.");
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
