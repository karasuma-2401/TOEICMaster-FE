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
  if (!email || email.length > 254 || !emailPattern.test(email))
    return problem(400, "Invalid verification data.", {
      Email: ["Invalid email address."],
    });

  try {
    const upstream = await postAuth("resend-verification", { email }, request);
    if (upstream.status === 202)
      return new NextResponse(null, {
        status: 202,
        headers: { "Cache-Control": "no-store" },
      });
    if (upstream.status === 400)
      return upstreamProblem(upstream, 400, "Invalid verification data.");
    if (upstream.status === 429) return rateLimited(upstream);
    throw new Error("Unexpected resend status");
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}
