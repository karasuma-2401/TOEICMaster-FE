import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

type Context = { params: Promise<{ part: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { part } = await context.params;
  if (!/^[1-7]$/.test(part)) return new Response(null, { status: 404 });
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/lr-exercise-bank/templates/${part}`,
    "GET",
  );
}
