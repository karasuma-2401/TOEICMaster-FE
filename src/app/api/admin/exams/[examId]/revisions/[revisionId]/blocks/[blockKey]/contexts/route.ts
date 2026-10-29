import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

interface RouteContext {
  params: Promise<{ examId: string; revisionId: string; blockKey: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { examId, revisionId, blockKey } = await context.params;
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}/blocks/${encodeURIComponent(blockKey)}/contexts`,
    "PUT",
  );
}
