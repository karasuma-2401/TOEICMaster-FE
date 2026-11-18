import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/client";
import { refreshSession } from "@/features/auth/api";
import * as examApi from "./exam-api";
import {
  completeMediaUploadIntent,
  createMediaUploadIntent,
  getReadingExams,
  importReadingExam,
  uploadFileToMediaIntent,
  updateReadingQuestion,
} from "./exam-api";

vi.mock("@/shared/api/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...original, getJson: vi.fn() };
});
vi.mock("@/features/auth/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/auth/api")>();
  return { ...original, refreshSession: vi.fn() };
});

import { getJson } from "@/shared/api/client";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("admin exam API client", () => {
  it("keeps Reading list requests on the same-origin endpoint", async () => {
    vi.mocked(getJson).mockResolvedValueOnce({
      items: [],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    await getReadingExams({ status: "ALL", page: 1, pageSize: 20 });

    expect(getJson).toHaveBeenCalledWith(
      "/api/admin/exams?status=&pageNumber=1&pageSize=20",
      undefined,
    );
  });

  it("uploads workspace bytes directly to the presigned storage URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["audio"], "group.mp3", { type: "audio/mpeg" });

    await uploadFileToMediaIntent(
      {
        intentId: "00000000-0000-4000-8000-000000000001",
        uploadUrl: "http://localhost:9000/exam-media/presigned",
        expiresAtUtc: "2026-11-03T12:00:00.000Z",
        requiredHeaders: { "Content-Type": "audio/mpeg" },
      },
      file,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9000/exam-media/presigned",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "audio/mpeg" },
        body: file,
        credentials: "omit",
      }),
    );
  });

  it("retries a save once after refreshing an expired session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(refreshSession).mockResolvedValue({
      id: "1",
      displayName: "Admin",
      email: "admin@example.com",
    });

    await updateReadingQuestion("exam-1", "revision-1", 101, {
      code: "P5-001",
      stem: "Choose the correct answer.",
      optionA: "A",
      optionB: "B",
      optionC: "C",
      optionD: "D",
      correctKey: "A",
      translation: null,
      explanation: null,
      imageAssetId: null,
      imageRequired: false,
    });

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/admin/exams/exam-1/revisions/revision-1/questions/101",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("removes legacy uploadReadingMasterAudio and sends durationMs on audio upload intents", async () => {
    expect("uploadReadingMasterAudio" in examApi).toBe(false);

    const intentPayload = {
      intentId: "00000000-0000-4000-8000-000000000001",
      uploadUrl: "http://localhost:9000/exam-media/presigned",
      expiresAtUtc: "2026-11-03T12:00:00.000Z",
      requiredHeaders: { "Content-Type": "audio/mpeg" },
    };
    const completedPayload = {
      id: "11111111-1111-4111-8111-111111111111",
      contentType: "audio/mpeg",
      kind: "Audio",
      byteSize: 1024,
      durationMs: 18500,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(intentPayload, { status: 201 }))
      .mockResolvedValueOnce(Response.json(completedPayload, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await createMediaUploadIntent("exam-1", "revision-1", {
      ownerKind: "AudioGroup",
      ownerKey: "P1-Q1",
      contentType: "audio/mpeg",
      byteSize: 1024,
      durationMs: 18500,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/exams/exam-1/revisions/revision-1/media-upload-intents",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          ownerKind: "AudioGroup",
          ownerKey: "P1-Q1",
          contentType: "audio/mpeg",
          byteSize: 1024,
          durationMs: 18500,
        }),
      }),
    );

    const completed = await completeMediaUploadIntent(
      "exam-1",
      "revision-1",
      intentPayload.intentId,
    );
    expect(completed.durationMs).toBe(18500);
  });

  it("imports a Reading/Listening exam workbook without a masterAudio field", async () => {
    const draft = {
      examId: "11111111-1111-4111-8111-111111111111",
      revisionId: "22222222-2222-4222-8222-222222222222",
      code: "LR-2026-01",
      title: "ETS Test 01",
      versionNumber: 1,
      status: "Draft",
      questionCount: 200,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(draft, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const workbook = new File(["xlsx"], "exam.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const result = await importReadingExam(workbook);

    expect(result).toEqual(draft);
    const body = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("workbook")).toBe(workbook);
    expect(body.has("masterAudio")).toBe(false);
  });

  it("preserves authorization errors from a list endpoint", async () => {
    vi.mocked(getJson).mockRejectedValue(new ApiError(403, "Không có quyền."));
    await expect(
      getReadingExams({ status: "ALL", page: 1, pageSize: 20 }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
