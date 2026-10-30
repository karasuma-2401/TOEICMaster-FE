import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

type Context = { params: Promise<{ part: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { part } = await context.params;
  if (!/^[1-7]$/.test(part)) return new Response(null, { status: 404 });
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/lr-exercise-bank/parts/${part}/imports`,
    "POST",
    10 * 1024 * 1024 + 64 * 1024,
  );
}
