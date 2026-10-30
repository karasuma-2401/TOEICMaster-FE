import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

interface RouteContext {
  params: Promise<{
    examId: string;
    revisionId: string;
    questionNumber: string;
  }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { examId, revisionId, questionNumber } = await context.params;
  const number = Number(questionNumber);
  if (!Number.isInteger(number) || number < 1 || number > 200)
    return new Response(null, { status: 404 });
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}/questions/${number}`,
    "PUT",
  );
}
