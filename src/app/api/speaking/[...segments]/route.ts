import { NextRequest } from "next/server";
import { forwardSpeaking } from "@/features/speaking/server/speaking-proxy";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ segments: string[] }> };

export async function GET(request: NextRequest, { params }: Context) {
  return forwardSpeaking(request, (await params).segments, "GET");
}

export async function POST(request: NextRequest, { params }: Context) {
  return forwardSpeaking(request, (await params).segments, "POST");
}

export async function PUT(request: NextRequest, { params }: Context) {
  return forwardSpeaking(request, (await params).segments, "PUT");
}
