import { NextRequest, NextResponse } from "next/server";
import {
  postAuth,
  problem,
  rateLimited,
  readBody,
  sameOrigin,
  upstreamProblem,
} from "@/features/auth/server/backend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Invalid request.");
  const body = await readBody(request);
  if (!body) return problem(400, "Invalid recovery data.");

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || email.length > 254 || !emailPattern.test(email))
    return problem(400, "Invalid recovery data.", {
      Email: ["Invalid email address."],
    });

  try {
    const upstream = await postAuth("forgot-password", { email });
    if (upstream.status === 202)
      return new NextResponse(null, {
        status: 202,
        headers: { "Cache-Control": "no-store" },
      });
    if (upstream.status === 400)
      return upstreamProblem(upstream, 400, "Invalid recovery data.");
    if (upstream.status === 429) return rateLimited(upstream);
    throw new Error("Unexpected forgot-password status");
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}
