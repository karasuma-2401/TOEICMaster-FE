import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ examId: string; revisionId: string }> },
) {
  const { examId, revisionId } = await context.params;
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}/score-profile`,
    "PUT",
  );
}
