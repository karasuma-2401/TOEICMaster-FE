import { afterEach, describe, expect, it, vi } from "vitest";
import { flushWritingAnswerOnPageHide } from "./attempt-api";

afterEach(() => vi.unstubAllGlobals());

describe("Writing attempt API", () => {
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
