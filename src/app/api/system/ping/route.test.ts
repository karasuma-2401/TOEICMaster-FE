import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ping proxy", () => {
  it("uses runtime backend configuration", async () => {
    vi.stubEnv("API_BASE_URL", "http://api:8080");
    const mock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ service: "TOEICMaster", status: "ok" }),
      );
    vi.stubGlobal("fetch", mock);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(String(mock.mock.calls[0][0])).toBe(
      "http://api:8080/api/system/ping",
    );
  });
  it("hides upstream details on errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("sensitive connection details")),
    );
    const response = await GET();
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("sensitive");
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
  });
  it("rejects invalid configuration without issuing a request", async () => {
    vi.stubEnv("API_BASE_URL", "file:///etc/passwd");
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    expect((await GET()).status).toBe(502);
    expect(mock).not.toHaveBeenCalled();
  });
});
