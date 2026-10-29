import { NextRequest } from "next/server";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";

type Context = { params: Promise<{ part: string }> };

async function path(request: NextRequest, context: Context) {
  const { part } = await context.params;
  if (!/^[1-7]$/.test(part)) return null;
  const query = request.nextUrl.searchParams;
  const pageNumber = Number(query.get("pageNumber"));
  const pageSize = Number(query.get("pageSize"));
  const params = new URLSearchParams({
    pageNumber: String(
      Number.isInteger(pageNumber) && pageNumber > 0
        ? Math.min(pageNumber, 10_000)
        : 1,
    ),
    pageSize: String(
      Number.isInteger(pageSize) && pageSize >= 1 && pageSize <= 100
        ? pageSize
        : 20,
    ),
  });
  const search = query.get("query")?.trim().slice(0, 100);
  const difficulty = query.get("difficulty");
  const status = query.get("status");
  if (search) params.set("query", search);
  if (difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD")
    params.set("difficulty", difficulty);
  if (status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED")
    params.set("status", status);
  return `/api/v1/admin/lr-exercise-bank/parts/${part}/items?${params}`;
}

export async function GET(request: NextRequest, context: Context) {
  const target = await path(request, context);
  return target
    ? forwardAdminExamRequest(request, target, "GET")
    : new Response(null, { status: 404 });
}

export async function POST(request: NextRequest, context: Context) {
  const target = await path(request, context);
  return target
    ? forwardAdminExamRequest(request, target.split("?")[0], "POST")
    : new Response(null, { status: 404 });
}
