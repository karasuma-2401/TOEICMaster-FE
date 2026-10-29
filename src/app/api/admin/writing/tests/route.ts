import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

function listPath(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("query") ?? "")
    .trim()
    .slice(0, 100);
  const status = request.nextUrl.searchParams.get("status");
  const pageNumber = Number(request.nextUrl.searchParams.get("pageNumber"));
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize"));
  const params = new URLSearchParams({
    query,
    pageNumber: String(
      Number.isInteger(pageNumber) && pageNumber > 0
        ? Math.min(pageNumber, 10_000)
        : 1,
    ),
    pageSize: String([10, 20, 50].includes(pageSize) ? pageSize : 20),
  });
  if (status === "DRAFT" || status === "PUBLISHED")
    params.set("status", status);
  return `/api/v1/admin/writing/tests?${params}`;
}

export function GET(request: NextRequest) {
  return forwardAdminExamRequest(request, listPath(request), "GET");
}

export function POST(request: NextRequest) {
  return forwardAdminExamRequest(
    request,
    "/api/v1/admin/writing/tests",
    "POST",
  );
}
