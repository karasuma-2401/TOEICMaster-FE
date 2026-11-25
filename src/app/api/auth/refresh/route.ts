import { NextRequest } from "next/server";
import {
  authenticationResult,
  postAuth,
  problem,
  rateLimited,
  sameOrigin,
  success,
} from "@/features/auth/server/backend";
import {
  sessionCookie,
  setSessionCookie,
} from "@/features/auth/server/session";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Invalid request.");
  const current = sessionCookie(request);
  if (!current || Date.parse(current.refreshTokenExpiresAtUtc) <= Date.now())
    return problem(401, "Session is invalid or has expired.");
  try {
    const upstream = await postAuth(
      "refresh",
      {
        refreshToken: current.refreshToken,
      },
      request,
    );
    if (upstream.status === 401)
      return problem(401, "Session is invalid or has expired.");
    if (upstream.status === 429) return rateLimited(upstream);
    if (upstream.status !== 200) throw new Error("Unexpected refresh status");
    const session = await authenticationResult(upstream, current.rememberMe);
    const response = success(session);
    setSessionCookie(response, session);
    return response;
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}
