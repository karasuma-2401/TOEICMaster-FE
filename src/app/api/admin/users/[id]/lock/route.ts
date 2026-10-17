import { NextRequest } from "next/server";
import {
  adminUserPath,
  forwardAdminUsers,
} from "@/features/admin/server/admin-users-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return forwardAdminUsers(request, adminUserPath(id, "lock"), "POST");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return forwardAdminUsers(request, adminUserPath(id, "lock"), "DELETE");
}
