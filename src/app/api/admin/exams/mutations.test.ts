import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { forwardAdminExamRequest } from "@/features/admin/server/admin-exams-proxy";
import { POST as createProfile } from "../score-profiles/route";
import { POST as fork } from "./[examId]/revisions/route";
import { PUT as updateProfile } from "./[examId]/revisions/[revisionId]/score-profile/route";

vi.mock("@/features/admin/server/admin-exams-proxy", () => ({
  forwardAdminExamRequest: vi.fn(),
}));

it("routes all three missing admin mutations through the protected exam proxy", async () => {
  vi.mocked(forwardAdminExamRequest).mockResolvedValue(
    new Response(null, { status: 204 }),
  );
  const request = new NextRequest("http://localhost/api/admin/exams", {
    method: "POST",
  });
  const context = {
    params: Promise.resolve({ examId: "exam", revisionId: "revision" }),
  };
  await createProfile(request);
  await fork(request, context);
  await updateProfile(request, context);
  expect(
    vi
      .mocked(forwardAdminExamRequest)
      .mock.calls.map(([, path, method]) => [path, method]),
  ).toEqual([
    ["/api/v1/admin/score-profiles", "POST"],
    ["/api/v1/admin/exams/exam/revisions", "POST"],
    ["/api/v1/admin/exams/exam/revisions/revision/score-profile", "PUT"],
  ]);
});
