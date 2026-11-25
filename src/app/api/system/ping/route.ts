import { NextResponse } from "next/server";
import { forwardBffRequest } from "@/shared/server/bff-proxy";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const config = { auth: "public" as const, timeoutMs: 5000 };
    const versioned = await forwardBffRequest(request, {
      ...config,
      upstreamPath: "/api/v1/system/ping",
    });
    const response =
      versioned.status === 404
        ? await forwardBffRequest(request, {
            ...config,
            upstreamPath: "/api/system/ping",
          })
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
    return NextResponse.json(
      { service: value.service, status: value.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { title: "Service unavailable", status: 502 },
      {
        status: 502,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
