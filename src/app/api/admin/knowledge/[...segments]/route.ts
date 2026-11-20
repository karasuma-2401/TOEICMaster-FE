import { NextRequest } from "next/server";
import { forwardAdminKnowledge } from "@/features/knowledge/server/admin-knowledge-proxy";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ segments: string[] }> };

export async function GET(request: NextRequest, { params }: Context) {
  return forwardAdminKnowledge(request, (await params).segments, "GET");
}

export async function POST(request: NextRequest, { params }: Context) {
  return forwardAdminKnowledge(request, (await params).segments, "POST");
}

export async function PUT(request: NextRequest, { params }: Context) {
  return forwardAdminKnowledge(request, (await params).segments, "PUT");
}

export async function DELETE(request: NextRequest, { params }: Context) {
  return forwardAdminKnowledge(request, (await params).segments, "DELETE");
}
