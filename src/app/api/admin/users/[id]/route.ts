import { NextRequest } from "next/server";
import {
  adminUserPath,
  forwardAdminUsers,
} from "@/features/admin/server/admin-users-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return forwardAdminUsers(request, adminUserPath(id), "GET");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return forwardAdminUsers(request, adminUserPath(id), "PATCH");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return forwardAdminUsers(request, adminUserPath(id), "DELETE");
}
