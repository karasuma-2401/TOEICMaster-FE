import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "@/features/auth/api";
import {
  archiveSpeakingExercise,
  createSpeakingTest,
  listSpeakingExercises,
  updateSpeakingExercise,
} from "./admin-api";
import { exerciseDto, ids, pageDto, testDetailDto } from "./testing/fixtures";

vi.mock("@/features/auth/api", () => ({ refreshSession: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

describe("Speaking admin API", () => {
  it("sends filters as a query string and skips empty values", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json(pageDto([exerciseDto(1)])));
    vi.stubGlobal("fetch", fetchMock);

    await listSpeakingExercises({
      part: 3,
      query: "",
      status: "PUBLISHED",
      pageNumber: 2,
      pageSize: 10,
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/admin/speaking/exercises?part=3&status=PUBLISHED&pageNumber=2&pageSize=10",
    );
  });

  it("wraps updates with the version and archives with a version query", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(exerciseDto(5)))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { id, version, updatedAtUtc, ...input } = exerciseDto(5);
    void updatedAtUtc;

    await updateSpeakingExercise(id, version, input as never);
    await archiveSpeakingExercise({ id, version });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      version: 3,
      exercise: { part: 5, code: "SP5-001" },
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      `/api/admin/speaking/exercises/${id}?version=3`,
    );
    expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
  });

  it("numbers test slots per Part", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(testDetailDto()));
    vi.stubGlobal("fetch", fetchMock);

    await createSpeakingTest({
      code: "SPK",
      title: "Test",
      description: "",
      exerciseIds: { 1: ["a", "b"], 2: ["c"], 3: [], 4: [], 5: ["d"] },
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).exercises).toEqual([
      { exerciseId: "a", part: 1, sequenceNumber: 1 },
      { exerciseId: "b", part: 1, sequenceNumber: 2 },
      { exerciseId: "c", part: 2, sequenceNumber: 1 },
      { exerciseId: "d", part: 5, sequenceNumber: 1 },
    ]);
  });

  it("refreshes the session once after a 401 and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(pageDto([])));
    vi.stubGlobal("fetch", fetchMock);

    await listSpeakingExercises({ pageNumber: 1, pageSize: 5 });

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    void ids;
  });
});
