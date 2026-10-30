import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSpeakingTests,
  nextSpeakingPhase,
  startSpeakingAttempt,
  uploadSpeakingRecording,
} from "./api";
import { attemptDto, ids, pageDto, testSummaryDto } from "./testing/fixtures";

vi.mock("@/features/auth/api", () => ({ refreshSession: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

describe("Speaking learner API", () => {
  it("lists published tests through the BFF", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json(pageDto([testSummaryDto()])));
    vi.stubGlobal("fetch", fetchMock);

    const tests = await getSpeakingTests();

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/speaking/tests?pageNumber=1&pageSize=50",
    );
    expect(
      tests[0].parts.reduce((sum, part) => sum + part.questionCount, 0),
    ).toBe(11);
  });

  it("starts an attempt and advances phases with JSON bodies", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json(attemptDto())));
    vi.stubGlobal("fetch", fetchMock);

    await startSpeakingAttempt(ids.test, "PART_4");
    await nextSpeakingPhase(ids.attempt);

    const [startPath, startInit] = fetchMock.mock.calls[0];
    expect(startPath).toBe("/api/speaking/attempts");
    expect(JSON.parse(startInit.body)).toEqual({
      testId: ids.test,
      mode: "PART_4",
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      `/api/speaking/attempts/${ids.attempt}/next`,
    );
  });

  it("uploads a recording as multipart and surfaces backend titles", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(attemptDto()))
      .mockResolvedValueOnce(
        Response.json(
          { title: "Đã hết thời gian tải bản ghi." },
          { status: 409 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const blob = new Blob(["audio"], { type: "audio/webm" });

    await uploadSpeakingRecording(ids.attempt, 2, blob, 14);
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
    expect(form.get("durationSeconds")).toBe("14");
    expect(form.get("file")).toBeInstanceOf(Blob);

    await expect(
      uploadSpeakingRecording(ids.attempt, 2, blob, 14),
    ).rejects.toMatchObject({
      status: 409,
      message: "Đã hết thời gian tải bản ghi.",
    });
    await expect(
      uploadSpeakingRecording(ids.attempt, 2, new Blob([]), 0),
    ).rejects.toMatchObject({ status: 400 });
  });
});
