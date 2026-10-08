import { afterEach, describe, expect, it, vi } from "vitest";
import { ping } from "./api";
import { ApiError } from "@/shared/api/client";

afterEach(() => vi.unstubAllGlobals());

describe("ping", () => {
  it("reads the backend contract through the same origin", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ service: "TOEICMaster", status: "ok" }),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await ping()).toEqual({ service: "TOEICMaster", status: "ok" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/system/ping");
  });
  it("rejects an unexpected backend contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ status: "wrong" })),
    );
    await expect(ping()).rejects.toThrow("Phản hồi dịch vụ không hợp lệ.");
  });
  it("keeps the HTTP status when the service is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 502 })),
    );
    await expect(ping()).rejects.toEqual(
      new ApiError(502, "Không thể kết nối dịch vụ."),
    );
  });
  it("passes cancellation to fetch", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(ping(controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
