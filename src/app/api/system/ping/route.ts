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
    const options: RequestInit = {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    };
    const versioned = await fetch(
      new URL("/api/v1/system/ping", base),
      options,
    );
    const response =
      versioned.status === 404
        ? await fetch(new URL("/api/system/ping", base), options)
        : versioned;
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
