import { NextRequest, NextResponse } from "next/server";
import {
  postAuth,
  problem,
  rateLimited,
  readBoundedBody,
  sameOrigin,
  upstreamProblem,
} from "@/features/auth/server/backend";
import { clearSessionCookie } from "@/features/auth/server/session";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Invalid request.");
  const bodyResult = await readBoundedBody(request);
  if (!bodyResult.ok)
    return bodyResult.response ?? problem(400, "Invalid password reset data.");
  const body = bodyResult.data;

  const resetToken = typeof body.resetToken === "string" ? body.resetToken : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";
  const errors: Record<string, string[]> = {};
  if (!resetToken || resetToken.length > 256)
    errors.ResetToken = ["Invalid password reset request."];
  if (newPassword.length < 8 || newPassword.length > 128)
    errors.NewPassword = ["New password must be between 8 and 128 characters."];
  if (Object.keys(errors).length)
    return problem(400, "Invalid password reset data.", errors);

  try {
    const upstream = await postAuth(
      "reset-password",
      {
        resetToken,
        newPassword,
      },
      request,
    );
    if (upstream.status === 204) {
      const response = new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
      clearSessionCookie(response);
      return response;
    }
    if (upstream.status === 400)
      return upstreamProblem(upstream, 400, "Invalid password reset request.");
    if (upstream.status === 429) return rateLimited(upstream);
    throw new Error("Unexpected reset-password status");
  } catch {
    return problem(502, "Service unavailable. Please try again later.");
  }
}
