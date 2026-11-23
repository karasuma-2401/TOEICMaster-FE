import { NextRequest } from "next/server";
import { backendFetch, problem } from "@/features/auth/server/backend";
import { forward } from "@/features/user/server/profile-proxy";
import { relay } from "@/features/speaking/server/upstream";

type Context = { params: Promise<{ segments: string[] }> };

async function handle(
  request: NextRequest,
  context: Context,
  method: "GET" | "PUT" | "DELETE",
) {
  const { segments } = await context.params;
  const path = segments.join("/");
  const saved = /^saved(?:\/[0-9a-f-]{36})?$/i.test(path);
  const publicPath =
    /^(categories|articles|articles\/[a-z0-9-]+(?:\/related)?|media\/[0-9a-f-]{36})$/i.test(
      path,
    );

  if (
    (!saved && !publicPath) ||
    (!saved && method !== "GET") ||
    (path === "saved" && method !== "GET")
  )
    return problem(404, "API endpoint not found.");

  const target = `/api/v1/knowledge/${path}${request.nextUrl.search}`;
  if (saved) return forward(request, target, { method });

  try {
    return relay(
      await backendFetch(target, "", {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      }),
    );
  } catch {
    return problem(502, "Unable to load knowledge content. Please try again.");
  }
}

export const GET = (request: NextRequest, context: Context) =>
  handle(request, context, "GET");
export const PUT = (request: NextRequest, context: Context) =>
  handle(request, context, "PUT");
export const DELETE = (request: NextRequest, context: Context) =>
  handle(request, context, "DELETE");
