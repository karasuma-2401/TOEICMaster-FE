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
  if (!body) return problem(400, "Dữ liệu đăng nhập không hợp lệ.");
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const rememberMe = body.rememberMe === true;
  const errors: Record<string, string[]> = {};
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.Email = ["Email không hợp lệ."];
  if (!password || password.length > 128)
    errors.Password = ["Mật khẩu không hợp lệ."];
  if (Object.keys(errors).length)
    return problem(400, "Dữ liệu đăng nhập không hợp lệ.", errors);
  try {
    const upstream = await postAuth("login", { email, password, rememberMe });
    if (upstream.status === 400)
      return upstreamProblem(upstream, 400, "Dữ liệu đăng nhập không hợp lệ.");
    if (upstream.status === 401)
      return problem(401, "Email hoặc mật khẩu không chính xác.");
    if (upstream.status !== 200) throw new Error("Unexpected auth status");
    const session = await authenticationResult(upstream, rememberMe);
    const response = success(session);
    setSessionCookie(response, session);
    return response;
  } catch {
    return problem(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
