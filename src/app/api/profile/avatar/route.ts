import { NextRequest } from "next/server";
import { problem } from "@/features/auth/server/backend";
import { AVATAR_MAX_BYTES } from "@/features/user/profile";
import { forward } from "@/features/user/server/profile-proxy";
import { authorizeBffRequest } from "@/shared/server/bff-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return forward(request, "/api/v1/profile/avatar", { method: "GET" });
}

export async function PUT(request: NextRequest) {
  const access = authorizeBffRequest(request, { method: "PUT", auth: "user" });
  if (!access.ok) return access.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (
    !(file instanceof File) ||
    file.size <= 0 ||
    file.size > AVATAR_MAX_BYTES
  ) {
    return problem(400, "Invalid image or file size exceeds 2MB.", {
      avatar: ["Invalid image or file size exceeds 2MB."],
    });
  }
  const body = new FormData();
  body.append("file", file, file.name);
  return forward(request, "/api/v1/profile/avatar", {
    method: "PUT",
    body,
  });
}
