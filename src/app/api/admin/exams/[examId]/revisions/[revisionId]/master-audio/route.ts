import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

interface RouteContext {
  params: Promise<{ examId: string; revisionId: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { examId, revisionId } = await context.params;
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}/master-audio`,
    "PUT",
  );
}
