import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { problem, sameOrigin } from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";
import {
  backendBase,
  readForwardBody,
  relay,
  type ForwardBody,
} from "./upstream";

const anonymousCookieName = "toeicmaster_speaking_anonymous";
const anonymousHeaderName = "X-Speaking-Anonymous-Session";
/** Recording upload limit (backend caps at 4 MiB plus multipart overhead). */
export const recordingUploadLimit = 4 * 1024 * 1024 + 64 * 1024;

type Method = "GET" | "POST" | "PUT";
const id = "[0-9a-f-]{36}";
const routes: { pattern: RegExp; methods: Method[]; upload?: boolean }[] = [
  { pattern: /^tests$/, methods: ["GET"] },
  { pattern: new RegExp(`^tests/${id}$`, "i"), methods: ["GET"] },
  { pattern: /^exercises$/, methods: ["GET"] },
  { pattern: /^evaluation-availability$/, methods: ["GET"] },
  { pattern: new RegExp(`^exercises/${id}$`, "i"), methods: ["GET"] },
  { pattern: new RegExp(`^media/${id}$`, "i"), methods: ["GET"] },
  { pattern: /^attempts$/, methods: ["GET", "POST"] },
  { pattern: new RegExp(`^attempts/${id}$`, "i"), methods: ["GET"] },
  {
    pattern: new RegExp(
      `^attempts/${id}/(next|submit|evaluation-consent)$`,
      "i",
    ),
    methods: ["POST"],
  },
  {
    pattern: new RegExp(`^attempts/${id}/recordings/[1-9]\\d?$`, "i"),
    methods: ["GET", "PUT"],
    upload: true,
  },
];

export async function forwardSpeaking(
  request: NextRequest,
  segments: string[],
  method: Method,
) {
  const path = segments.join("/");
  const route = routes.find((item) => item.pattern.test(path));
  if (!route || !route.methods.includes(method))
    return problem(404, "Không tìm thấy API Speaking.");
  if (method !== "GET" && !sameOrigin(request))
    return problem(403, "Yêu cầu không hợp lệ.");

  const session = sessionCookie(request);
  const accessToken =
    session && Date.parse(session.refreshTokenExpiresAtUtc) > Date.now()
      ? session.accessToken
      : null;
  let anonymousSession: string | null = null;
  if (path.startsWith("attempts") && !accessToken) {
    const cookie = request.cookies.get(anonymousCookieName)?.value;
    anonymousSession = /^[0-9a-f-]{36}$/i.test(cookie ?? "")
      ? cookie!
      : randomUUID();
  }

  const body: ForwardBody =
    method === "GET"
      ? { ok: true }
      : await readForwardBody(
          request,
          route.upload ? recordingUploadLimit : null,
        );
  if (!body.ok) return body.response;

  const headers = new Headers({ Accept: "application/json" });
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (anonymousSession) headers.set(anonymousHeaderName, anonymousSession);
  if (body.contentType) headers.set("Content-Type", body.contentType);
  const url = new URL(`/api/v1/speaking/${path}`, backendBase());
  url.search = new URL(request.url).search;

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      body: body.body,
      cache: "no-store",
      signal: AbortSignal.timeout(route.upload ? 30_000 : 5_000),
    });
    const response = relay(upstream);
    if (anonymousSession)
      response.cookies.set(anonymousCookieName, anonymousSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    return response;
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
