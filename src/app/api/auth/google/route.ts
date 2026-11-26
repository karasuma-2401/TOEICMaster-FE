import { NextRequest } from "next/server";
import {
  authenticationResult,
  postAuth,
  problem,
  rateLimited,
  readBoundedBody,
  sameOrigin,
  success,
  upstreamProblem,
} from "@/features/auth/server/backend";
import { setSessionCookie } from "@/features/auth/server/session";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Invalid request.");
  const bodyResult = await readBoundedBody(request);
  if (!bodyResult.ok)
    return bodyResult.response ?? problem(400, "Invalid Google data.");
  const body = bodyResult.data;
  const credential = typeof body.credential === "string" ? body.credential : "";
  const rememberMe = body.rememberMe === true;
  if (!credential || credential.length > 8192)
    return problem(400, "Invalid Google data.", {
      Credential: ["Invalid Google credential."],
    });
  try {
    const upstream = await postAuth(
      "google",
      { credential, rememberMe },
      request,
    );
    if (upstream.status === 400)
      return upstreamProblem(upstream, 400, "Invalid Google data.");
    if (upstream.status === 401)
      return problem(401, "Google credential is invalid or has expired.");
    if (upstream.status === 409)
      return problem(
        409,
        "This email already belongs to another account. Please sign in with your password to link Google.",
      );
    if (upstream.status === 429) return rateLimited(upstream);
    if (upstream.status !== 200) throw new Error("Unexpected auth status");
    const session = await authenticationResult(upstream, rememberMe);
    const response = success(session);
    setSessionCookie(response, session);
    return response;
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}
