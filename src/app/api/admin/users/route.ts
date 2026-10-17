import { NextRequest } from "next/server";
import { forwardAdminUsers } from "@/features/admin/server/admin-users-proxy";
import {
  adminUsersQueryString,
  parseAdminUsersQuery,
} from "@/features/admin/users";

export function GET(request: NextRequest) {
  const query = parseAdminUsersQuery(request.nextUrl.searchParams);
  const search = adminUsersQueryString(query);
  return forwardAdminUsers(request, `/api/v1/admin/users?${search}`, "GET");
}

export function POST(request: NextRequest) {
  return forwardAdminUsers(request, "/api/v1/admin/users", "POST");
}
