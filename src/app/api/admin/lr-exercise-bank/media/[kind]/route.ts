import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

type Context = { params: Promise<{ kind: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { kind } = await context.params;
  if (kind !== "audio" && kind !== "image")
    return new Response(null, { status: 404 });
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/lr-exercise-bank/media/${kind}`,
    "POST",
    20 * 1024 * 1024 + 64 * 1024,
  );
}
