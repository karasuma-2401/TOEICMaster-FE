import { afterEach, describe, expect, it, vi } from "vitest";
import {
  flushWritingAnswerOnPageHide,
  getWritingPracticeExercises,
  getWritingHistory,
  nextWritingQuestion,
  submitWritingAttempt,
} from "./attempt-api";

afterEach(() => vi.unstubAllGlobals());

describe("Writing attempt API", () => {
  it("explains generic backend validation errors in Vietnamese", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { title: "One or more validation errors occurred." },
            { status: 400 },
          ),
        ),
    );
    await expect(getWritingPracticeExercises(1)).rejects.toThrow(
      "Thông tin yêu cầu không hợp lệ",
    );
  });
  it("refreshes an expired signed-in session before retrying history", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ title: "Expired" }, { status: 401 }),
      )
      .mockResolvedValueOnce(
        Response.json({
          user: {
            id: "user-1",
            displayName: "User",
            email: "user@example.com",
          },
        }),
      )
      .mockResolvedValueOnce(Response.json({ items: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getWritingHistory()).resolves.toEqual([]);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/writing/attempts",
      "/api/auth/refresh",
      "/api/writing/attempts",
    ]);
  });

  it.each([nextWritingQuestion, submitWritingAttempt])(
    "sends a bodyless action without adding JSON headers",
    async (action) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          Response.json({ title: "Not found" }, { status: 404 }),
        );
      vi.stubGlobal("fetch", fetchMock);
      await expect(action("attempt-1")).rejects.toThrow("Not found");
      expect(fetchMock.mock.calls[0][1]).toMatchObject({
        method: "POST",
        headers: { Accept: "application/json" },
      });
      expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    },
  );
  it("validates a published practice exercise page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          items: [
            {
              id: "exercise",
              part: 2,
              code: "WP2-1",
              topic: "Work",
              difficulty: "EASY",
            },
          ],
          pageNumber: 1,
          pageSize: 20,
          totalCount: 1,
        }),
      ),
    );
    const result = await getWritingPracticeExercises(2);
    expect(result.items[0].code).toBe("WP2-1");
  });

  it("rejects an invalid practice exercise response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          items: [
            {
              id: "exercise",
              part: 7,
              code: "WP2-1",
              topic: "Work",
              difficulty: "EASY",
            },
          ],
          pageNumber: 1,
          pageSize: 20,
          totalCount: 1,
        }),
      ),
    );
    await expect(getWritingPracticeExercises(2)).rejects.toThrow(
      "không hợp lệ",
    );
  });
  it("keeps a final answer request alive when the learner leaves the page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await flushWritingAnswerOnPageHide("attempt id", 3, "Final draft");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/writing/attempts/attempt%20id/answers/3",
      expect.objectContaining({
        body: JSON.stringify({ answer: "Final draft" }),
        cache: "no-store",
        keepalive: true,
        method: "PUT",
      }),
    );
  });

  it("does not throw if the browser cancels the final page lifecycle request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network interrupted")),
    );

    await expect(
      flushWritingAnswerOnPageHide("attempt", 1, "Draft"),
    ).resolves.toBeUndefined();
  });
});
