import { afterEach, describe, expect, it, vi } from "vitest";
import { assessPronunciation, PronunciationApiError } from "./api";

const body = {
  recognitionStatus: "Recognized",
  referenceText: "think",
  recognizedText: "think",
  accuracyScore: 78,
  pronunciationScore: 80,
  completenessScore: 100,
  words: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function respond(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function failure(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as PronunciationApiError;
  }
  throw new Error("expected a failure");
}

describe("assessPronunciation", () => {
  it("posts the recording as FormData to the same-origin route", async () => {
    const fetchMock = respond(Response.json(body));
    const audio = new Blob(["x"], { type: "audio/ogg;codecs=opus" });
    const result = await assessPronunciation(audio, "think");
    expect(result.referenceText).toBe("think");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/pronunciation/assessments");
    expect(init.method).toBe("POST");
    const form = init.body as FormData;
    expect(form.get("referenceText")).toBe("think");
    expect(form.get("locale")).toBe("en-US");
    expect((form.get("file") as File).name).toBe("recording.ogg");
  });

  it.each([
    [401, "UNAUTHORIZED"],
    [400, "INVALID_AUDIO"],
    [413, "INVALID_AUDIO"],
    [500, "UNAVAILABLE"],
    [503, "UNAVAILABLE"],
  ] as const)("maps %d to %s", async (status, code) => {
    respond(new Response("{}", { status }));
    const error = await failure(assessPronunciation(new Blob(["x"]), "think"));
    expect(error).toBeInstanceOf(PronunciationApiError);
    expect(error.code).toBe(code);
    expect(error.message).not.toMatch(/stack|exception/i);
  });

  it("reads Retry-After on 429", async () => {
    respond(
      new Response("{}", { status: 429, headers: { "retry-after": "12" } }),
    );
    const error = await failure(assessPronunciation(new Blob(["x"]), "think"));
    expect(error.code).toBe("RATE_LIMITED");
    expect(error.retryAfterSeconds).toBe(12);
    expect(error.message).toContain("12 giây");
  });

  it("rejects a malformed body", async () => {
    respond(Response.json({ hello: "world" }));
    const error = await failure(assessPronunciation(new Blob(["x"]), "think"));
    expect(error.code).toBe("INVALID_RESPONSE");
  });

  it("reports network errors and passes through aborts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fail")));
    const error = await failure(assessPronunciation(new Blob(["x"]), "think"));
    expect(error.code).toBe("NETWORK");

    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));
    await expect(
      assessPronunciation(new Blob(["x"]), "think", controller.signal),
    ).rejects.toBe(abort);
  });
});
