import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

type ProblemErrors = Record<string, string[]>;

function error(status: number, title: string, errors?: ProblemErrors) {
  return NextResponse.json(
    { title, status, ...(errors ? { errors } : {}) },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

function validate(value: unknown): {
  data?: RegisterRequest;
  errors?: ProblemErrors;
} {
  if (typeof value !== "object" || value === null) {
    return { errors: { request: ["Dữ liệu đăng ký không hợp lệ."] } };
  }
  const candidate = value as Record<string, unknown>;
  const displayName =
    typeof candidate.displayName === "string"
      ? candidate.displayName.trim()
      : "";
  const email =
    typeof candidate.email === "string" ? candidate.email.trim() : "";
  const password =
    typeof candidate.password === "string" ? candidate.password : "";
  const errors: ProblemErrors = {};
  if (!displayName || displayName.length > 100)
    errors.DisplayName = ["Tên hiển thị phải có từ 1 đến 100 ký tự."];
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.Email = ["Email không hợp lệ."];
  if (password.length < 8 || password.length > 128)
    errors.Password = ["Mật khẩu cần từ 8 đến 128 ký tự."];
  if (Object.keys(errors).length > 0) return { errors };
  return { data: { displayName, email, password } };
}

function upstreamErrors(value: unknown): ProblemErrors | undefined {
  if (typeof value !== "object" || value === null || !("errors" in value))
    return undefined;
  const entries = Object.entries(
    value.errors as Record<string, unknown>,
  ).filter(
    ([, messages]) =>
      Array.isArray(messages) &&
      messages.every((message) => typeof message === "string"),
  );
  return entries.length > 0
    ? Object.fromEntries(
        entries.map(([key, messages]) => [key, messages as string[]]),
      )
    : undefined;
}

export async function POST(request: NextRequest) {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return error(400, "Dữ liệu đăng ký không hợp lệ.");
  }

  const validated = validate(value);
  if (!validated.data)
    return error(400, "Dữ liệu đăng ký không hợp lệ.", validated.errors);

  try {
    const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password
    )
      throw new Error("Invalid API_BASE_URL");

    const response = await fetch(new URL("/api/auth/register", base), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validated.data),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 202) return new NextResponse(null, { status: 202 });
    if (response.status === 409)
      return error(409, "Email này đã được sử dụng.");
    if (response.status === 400) {
      const body: unknown = await response.json().catch(() => undefined);
      return error(400, "Dữ liệu đăng ký không hợp lệ.", upstreamErrors(body));
    }
    throw new Error("Unexpected upstream response");
  } catch {
    return error(502, "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
