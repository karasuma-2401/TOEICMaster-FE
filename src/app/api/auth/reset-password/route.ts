import { NextRequest, NextResponse } from "next/server";
import {
  postAuth,
  problem,
  rateLimited,
  readBody,
  sameOrigin,
  upstreamProblem,
} from "@/features/auth/server/backend";
import { clearSessionCookie } from "@/features/auth/server/session";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Yêu cầu không hợp lệ.");
  const body = await readBody(request);
  if (!body) return problem(400, "Dữ liệu đặt lại mật khẩu không hợp lệ.");

  const resetToken = typeof body.resetToken === "string" ? body.resetToken : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";
  const errors: Record<string, string[]> = {};
  if (!resetToken || resetToken.length > 256)
    errors.ResetToken = ["Yêu cầu đặt lại mật khẩu không hợp lệ."];
  if (newPassword.length < 8 || newPassword.length > 128)
    errors.NewPassword = ["Mật khẩu mới cần từ 8 đến 128 ký tự."];
  if (Object.keys(errors).length)
    return problem(400, "Dữ liệu đặt lại mật khẩu không hợp lệ.", errors);

  try {
    const upstream = await postAuth("reset-password", {
      resetToken,
      newPassword,
    });
    if (upstream.status === 204) {
      const response = new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
      clearSessionCookie(response);
      return response;
    }
    if (upstream.status === 400)
      return upstreamProblem(
        upstream,
        400,
        "Yêu cầu đặt lại mật khẩu không hợp lệ.",
      );
    if (upstream.status === 429) return rateLimited(upstream);
    throw new Error("Unexpected reset-password status");
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
