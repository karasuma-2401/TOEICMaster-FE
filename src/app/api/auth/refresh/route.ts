import { NextRequest } from "next/server";
import {
  authenticationResult,
  postAuth,
  problem,
  sameOrigin,
  success,
} from "@/features/auth/server/backend";
import {
  sessionCookie,
  setSessionCookie,
} from "@/features/auth/server/session";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Yêu cầu không hợp lệ.");
  const current = sessionCookie(request);
  if (!current || Date.parse(current.refreshTokenExpiresAtUtc) <= Date.now())
    return problem(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  try {
    const upstream = await postAuth("refresh", {
      refreshToken: current.refreshToken,
    });
    if (upstream.status === 401)
      return problem(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    if (upstream.status !== 200) throw new Error("Unexpected refresh status");
    const session = await authenticationResult(upstream, current.rememberMe);
    const response = success(session);
    setSessionCookie(response, session);
    return response;
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
