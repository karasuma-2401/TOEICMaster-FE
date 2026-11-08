import { NextRequest } from "next/server";
import { forwardAdminWriting } from "@/features/writing/server/admin-writing-proxy";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ segments: string[] }> };

export async function GET(request: NextRequest, { params }: Context) {
  return forwardAdminWriting(request, (await params).segments, "GET");
}

export async function POST(request: NextRequest, { params }: Context) {
  return forwardAdminWriting(request, (await params).segments, "POST");
}

export async function PUT(request: NextRequest, { params }: Context) {
  return forwardAdminWriting(request, (await params).segments, "PUT");
}

export async function DELETE(request: NextRequest, { params }: Context) {
  return forwardAdminWriting(request, (await params).segments, "DELETE");
}
