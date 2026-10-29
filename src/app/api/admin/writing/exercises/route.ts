import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

export function GET(request: NextRequest) {
  const part = Number(request.nextUrl.searchParams.get("part"));
  const pageNumber = Number(request.nextUrl.searchParams.get("pageNumber"));
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize"));
  const params = new URLSearchParams({
    part: String([1, 2, 3].includes(part) ? part : 1),
    status: "PUBLISHED",
    pageNumber: String(
      Number.isInteger(pageNumber) && pageNumber > 0
        ? Math.min(pageNumber, 10_000)
        : 1,
    ),
    pageSize: String([10, 20, 50].includes(pageSize) ? pageSize : 20),
  });
  return forwardAdminExamRequest(
    request,
    `/api/v1/admin/writing/exercises?${params}`,
    "GET",
  );
}
