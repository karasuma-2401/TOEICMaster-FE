import { NextRequest } from "next/server";
import { problem, readBody } from "@/features/auth/server/backend";
import { forward } from "@/features/user/server/profile-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  if (
    !body ||
    typeof body.currentPassword !== "string" ||
    typeof body.newPassword !== "string" ||
    typeof body.confirmPassword !== "string"
  ) {
    return problem(400, "Dữ liệu đổi mật khẩu không hợp lệ.");
  }
  const passwordChange = {
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
    confirmPassword: body.confirmPassword,
  };
  return forward(request, "/api/v1/users/me/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(passwordChange),
  });
}
