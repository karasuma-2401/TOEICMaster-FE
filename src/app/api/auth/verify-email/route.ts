import { NextRequest, NextResponse } from "next/server";
import {
  postAuth,
  problem,
  rateLimited,
  readBoundedBody,
  sameOrigin,
  upstreamProblem,
} from "@/features/auth/server/backend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Invalid request.");
  const bodyResult = await readBoundedBody(request);
  if (!bodyResult.ok)
    return bodyResult.response ?? problem(400, "Invalid verification data.");
  const body = bodyResult.data;

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const code = typeof body.code === "string" ? body.code : "";
  const errors: Record<string, string[]> = {};
  if (!email || email.length > 254 || !emailPattern.test(email))
    errors.Email = ["Invalid email address."];
  if (!/^\d{6}$/.test(code))
    errors.Code = ["Verification code must be 6 digits."];
  if (Object.keys(errors).length)
    return problem(400, "Invalid verification data.", errors);

  try {
    const upstream = await postAuth("verify-email", { email, code }, request);
    if (upstream.status === 204)
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    if (upstream.status === 400)
      return upstreamProblem(upstream, 400, "Invalid verification code.");
    if (upstream.status === 429) return rateLimited(upstream);
    throw new Error("Unexpected verification status");
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}
