import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

type Context = { params: Promise<{ part: string; id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const { part, id } = await context.params;
  if (!/^[1-7]$/.test(part) || !/^[0-9a-f-]{36}$/i.test(id))
    return new Response(null, { status: 404 });
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/lr-exercise-bank/parts/${part}/items/${id}`,
    "PATCH",
  );
}
