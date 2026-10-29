import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

export function GET(request: NextRequest) {
  return forwardAdminExamRequest(
    request,
    "/api/v1/admin/exams/import-template",
    "GET",
  );
}
