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

function isVerification(value: unknown): value is {
  resetToken: string;
  expiresAtUtc: string;
} {
  return (
    value !== null &&
    typeof value === "object" &&
    "resetToken" in value &&
    typeof value.resetToken === "string" &&
    value.resetToken.length > 0 &&
    value.resetToken.length <= 256 &&
    "expiresAtUtc" in value &&
    typeof value.expiresAtUtc === "string" &&
    Number.isFinite(Date.parse(value.expiresAtUtc))
  );
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Yêu cầu không hợp lệ.");
  const body = await readBody(request);
  if (!body) return problem(400, "Dữ liệu xác minh không hợp lệ.");

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const code = typeof body.code === "string" ? body.code : "";
  const errors: Record<string, string[]> = {};
  if (!email || email.length > 254 || !emailPattern.test(email))
    errors.Email = ["Email không hợp lệ."];
  if (!/^\d{6}$/.test(code)) errors.Code = ["Mã xác minh phải gồm 6 chữ số."];
  if (Object.keys(errors).length)
    return problem(400, "Dữ liệu xác minh không hợp lệ.", errors);

  try {
    const upstream = await postAuth("verify-password-reset", { email, code });
    if (upstream.status === 200) {
      const result: unknown = await upstream.json().catch(() => null);
      if (!isVerification(result))
        throw new Error("Invalid reset verification response");
      return NextResponse.json(result, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (upstream.status === 400)
      return upstreamProblem(
        upstream,
        400,
        "Mã đặt lại mật khẩu không hợp lệ.",
      );
    if (upstream.status === 429) return rateLimited(upstream);
    throw new Error("Unexpected reset verification status");
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
