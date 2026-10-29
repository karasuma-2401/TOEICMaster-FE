import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/client";
import { refreshSession } from "@/features/auth/api";
import {
  getReadingExams,
  getWritingTests,
  uploadReadingMasterAudio,
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
  it("keeps Reading and Writing list requests on same-origin endpoints", async () => {
    vi.mocked(getJson)
      .mockResolvedValueOnce({
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      })
      .mockResolvedValueOnce({
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
      });

    await getReadingExams({ status: "ALL", page: 1, pageSize: 20 });
    await getWritingTests({ q: "", status: "ALL", page: 1, pageSize: 20 });

    expect(getJson).toHaveBeenNthCalledWith(
      1,
      "/api/admin/exams?status=&pageNumber=1&pageSize=20",
      undefined,
    );
    expect(getJson).toHaveBeenNthCalledWith(
      2,
      "/api/admin/writing/tests?query=&status=&pageNumber=1&pageSize=20",
      undefined,
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
    });

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/admin/exams/exam-1/revisions/revision-1/questions/101",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("sends a master-audio file to the existing revision endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await uploadReadingMasterAudio(
      "exam-1",
      "revision-1",
      new File(["audio"], "master.mp3", {
        type: "audio/mpeg",
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/exams/exam-1/revisions/revision-1/master-audio",
      expect.objectContaining({ method: "PUT", body: expect.any(FormData) }),
    );
  });

  it("preserves authorization errors from a list endpoint", async () => {
    vi.mocked(getJson).mockRejectedValue(new ApiError(403, "Không có quyền."));
    await expect(
      getReadingExams({ status: "ALL", page: 1, pageSize: 20 }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
