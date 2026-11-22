import { NextRequest } from "next/server";
import { forwardPronunciationAssessment } from "@/features/pronunciation/server/pronunciation-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return forwardPronunciationAssessment(request);
}
