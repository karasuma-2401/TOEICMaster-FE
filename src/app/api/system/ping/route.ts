import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password
    ) {
      throw new Error("Invalid API_BASE_URL");
    }
    const response = await fetch(new URL("/api/system/ping", base), {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Upstream unavailable");
    const value: unknown = await response.json();
    if (
      typeof value !== "object" ||
      value === null ||
      !("service" in value) ||
      typeof value.service !== "string" ||
      !("status" in value) ||
      value.status !== "ok"
    ) {
      throw new Error("Invalid upstream response");
    }
    return NextResponse.json({ service: value.service, status: value.status });
  } catch {
    return NextResponse.json(
      { title: "Dịch vụ chưa sẵn sàng", status: 502 },
      { status: 502, headers: { "Content-Type": "application/problem+json" } },
    );
  }
}
