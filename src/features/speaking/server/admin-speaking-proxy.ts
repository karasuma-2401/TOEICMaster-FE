import { NextRequest } from "next/server";
import {
  backendFetch,
  problem,
  sameOrigin,
} from "@/features/auth/server/backend";
import { sessionCookie } from "@/features/auth/server/session";
import { readForwardBody, relay, type ForwardBody } from "./upstream";

/** Part 2 image upload limit: 5 MiB file plus multipart overhead. */
export const imageUploadLimit = 5 * 1024 * 1024 + 64 * 1024;

type Method = "GET" | "POST" | "PUT" | "DELETE";
const id = "[0-9a-f-]{36}";
const routes: { pattern: RegExp; methods: Method[]; upload?: boolean }[] = [
  { pattern: /^summary$/, methods: ["GET"] },
  { pattern: /^exercises$/, methods: ["GET", "POST"] },
  {
    pattern: new RegExp(`^exercises/${id}$`, "i"),
    methods: ["GET", "PUT", "DELETE"],
  },
  { pattern: /^media\/images$/, methods: ["POST"], upload: true },
  { pattern: new RegExp(`^media/${id}$`, "i"), methods: ["GET"] },
  { pattern: /^tests$/, methods: ["GET", "POST"] },
  { pattern: new RegExp(`^tests/${id}$`, "i"), methods: ["GET", "PUT"] },
  { pattern: new RegExp(`^tests/${id}/publish$`, "i"), methods: ["POST"] },
];

export async function forwardAdminSpeaking(
  request: NextRequest,
  segments: string[],
  method: Method,
) {
  const path = segments.join("/");
  const route = routes.find((item) => item.pattern.test(path));
  if (!route || !route.methods.includes(method))
    return problem(404, "Không tìm thấy API quản trị Speaking.");
  if (method !== "GET" && !sameOrigin(request))
    return problem(403, "Yêu cầu không hợp lệ.");

  const session = sessionCookie(request);
  if (!session || Date.parse(session.refreshTokenExpiresAtUtc) <= Date.now())
    return problem(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  const role = (session as typeof session & { role?: unknown }).role;
  if (role !== "ADMIN")
    return problem(403, "Bạn không có quyền truy cập chức năng này.");

  const body: ForwardBody =
    method === "GET" || method === "DELETE"
      ? { ok: true }
      : await readForwardBody(request, route.upload ? imageUploadLimit : null);
  if (!body.ok) return body.response;

  const search = new URL(request.url).search;
  try {
    const upstream = await backendFetch(
      `/api/v1/admin/speaking/${path}${search}`,
      session.accessToken,
      {
        method,
        headers: body.contentType ? { "Content-Type": body.contentType } : {},
        body: body.body,
        signal: AbortSignal.timeout(route.upload ? 30_000 : 5_000),
      },
    );
    return relay(upstream);
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
