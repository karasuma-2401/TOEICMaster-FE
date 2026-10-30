import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

export function POST(request: NextRequest) {
  return forwardAdminExamRequest(request, "/api/v1/admin/exams/import", "POST");
}
