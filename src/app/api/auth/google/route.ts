import { NextRequest } from "next/server";
import {
  authenticationResult,
  postAuth,
  problem,
  readBody,
  sameOrigin,
  success,
  upstreamProblem,
} from "@/features/auth/server/backend";
import { setSessionCookie } from "@/features/auth/server/session";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return problem(403, "Yêu cầu không hợp lệ.");
  const body = await readBody(request);
  if (!body) return problem(400, "Dữ liệu Google không hợp lệ.");
  const credential = typeof body.credential === "string" ? body.credential : "";
  const rememberMe = body.rememberMe === true;
  if (!credential || credential.length > 8192)
    return problem(400, "Dữ liệu Google không hợp lệ.", {
      Credential: ["Google credential không hợp lệ."],
    });
  try {
    const upstream = await postAuth("google", { credential, rememberMe });
    if (upstream.status === 400)
      return upstreamProblem(upstream, 400, "Dữ liệu Google không hợp lệ.");
    if (upstream.status === 401)
      return problem(401, "Google credential không hợp lệ hoặc đã hết hạn.");
    if (upstream.status === 409)
      return problem(
        409,
        "Email này đã thuộc một tài khoản khác. Hãy đăng nhập bằng mật khẩu để liên kết Google.",
      );
    if (upstream.status !== 200) throw new Error("Unexpected auth status");
    const session = await authenticationResult(upstream, rememberMe);
    const response = success(session);
    setSessionCookie(response, session);
    return response;
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
