import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

interface RouteContext {
  params: Promise<{ testId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { testId } = await context.params;
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/writing/tests/${encodeURIComponent(testId)}/publish`,
    "POST",
  );
}
