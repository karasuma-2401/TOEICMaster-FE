import { NextRequest, NextResponse } from "next/server";
import { rateLimited, sameOrigin } from "@/features/auth/server/backend";

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
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
      },
    },
  );
}

function validate(value: unknown): {
  data?: RegisterRequest;
  errors?: ProblemErrors;
} {
  if (typeof value !== "object" || value === null) {
    return { errors: { request: ["Invalid registration data."] } };
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
    errors.DisplayName = ["Display name must be between 1 and 100 characters."];
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.Email = ["Invalid email address."];
  if (password.length < 8 || password.length > 128)
    errors.Password = ["Password must be between 8 and 128 characters."];
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
  if (!sameOrigin(request)) return error(403, "Invalid request.");
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return error(400, "Invalid registration data.");
  }

  const validated = validate(value);
  if (!validated.data)
    return error(400, "Invalid registration data.", validated.errors);

  try {
    const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password
    )
      throw new Error("Invalid API_BASE_URL");

    const response = await fetch(new URL("/api/v1/auth/register", base), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validated.data),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 202)
      return new NextResponse(null, {
        status: 202,
        headers: { "Cache-Control": "no-store" },
      });
    if (response.status === 409)
      return error(409, "This email is already in use.");
    if (response.status === 400) {
      const body: unknown = await response.json().catch(() => undefined);
      return error(400, "Invalid registration data.", upstreamErrors(body));
    }
    if (response.status === 429) return rateLimited(response);
    throw new Error("Unexpected upstream response");
  } catch {
    return error(502, "Service unavailable. Please try again later.");
  }
}
