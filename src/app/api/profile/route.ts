import { NextRequest } from "next/server";
import { problem, readBody } from "@/features/auth/server/backend";
import { forward } from "@/features/user/server/profile-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return forward(request, "/api/v1/users/me", { method: "GET" });
}

export async function PUT(request: NextRequest) {
  const body = await readBody(request);
  if (
    !body ||
    typeof body.displayName !== "string" ||
    !(typeof body.phone === "string" || body.phone === null) ||
    !(typeof body.dateOfBirth === "string" || body.dateOfBirth === null) ||
    !(typeof body.targetScore === "number" || body.targetScore === null)
  ) {
    return problem(400, "Dữ liệu hồ sơ không hợp lệ.");
  }
  const editableProfile = {
    displayName: body.displayName,
    phone: body.phone,
    dateOfBirth: body.dateOfBirth,
    targetScore: body.targetScore,
  };
  return forward(request, "/api/v1/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(editableProfile),
  });
}
