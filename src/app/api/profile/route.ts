import { NextRequest } from "next/server";
import { problem, readBody } from "@/features/auth/server/backend";
import { forward } from "@/features/user/server/profile-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return forward(request, "/api/v1/profile", { method: "GET" });
}

export async function PUT(request: NextRequest) {
  const body = await readBody(request);
  if (!body || typeof body.displayName !== "string") {
    return problem(400, "Dữ liệu hồ sơ không hợp lệ.");
  }
  return forward(request, "/api/v1/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: body.displayName }),
  });
}
