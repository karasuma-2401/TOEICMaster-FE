import { NextRequest } from "next/server";
import { problem } from "@/features/auth/server/backend";
import { AVATAR_MAX_BYTES } from "@/features/user/profile";
import { forward } from "@/features/user/server/profile-proxy";
import {
  authorizeBffRequest,
  readMultipartStream,
} from "@/shared/server/bff-proxy";

export const dynamic = "force-dynamic";

const AVATAR_MULTIPART_MAX_BYTES = AVATAR_MAX_BYTES + 64 * 1024;

export function GET(request: NextRequest) {
  return forward(request, "/api/v1/profile/avatar", { method: "GET" });
}

export async function PUT(request: NextRequest) {
  const access = authorizeBffRequest(request, { method: "PUT", auth: "user" });
  if (!access.ok) return access.response;

  const streamed = await readMultipartStream(
    request,
    AVATAR_MULTIPART_MAX_BYTES,
    "Uploaded avatar payload exceeds the size limit.",
  );
  if (streamed instanceof Response) return streamed;

  const form = await new Response(streamed.body, {
    headers: { "content-type": streamed.contentType },
  })
    .formData()
    .catch(() => null);
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
