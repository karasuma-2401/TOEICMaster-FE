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
    return bodyResult.response ?? problem(400, "Invalid sign-in data.");
  const body = bodyResult.data;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const rememberMe = body.rememberMe === true;
  const errors: Record<string, string[]> = {};
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.Email = ["Invalid email address."];
  if (!password || password.length > 128)
    errors.Password = ["Invalid password."];
  if (Object.keys(errors).length)
    return problem(400, "Invalid sign-in data.", errors);
  try {
    const upstream = await postAuth(
      "login",
      { email, password, rememberMe },
      request,
    );
    if (upstream.status === 400)
      return upstreamProblem(upstream, 400, "Invalid sign-in data.");
    if (upstream.status === 401)
      return problem(401, "Incorrect email or password.");
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
