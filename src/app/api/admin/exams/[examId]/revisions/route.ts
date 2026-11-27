import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> },
) {
  const { examId } = await context.params;
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/exams/${encodeURIComponent(examId)}/revisions`,
    "POST",
  );
}
