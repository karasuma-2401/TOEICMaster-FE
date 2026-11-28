import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { sameOrigin } from "./backend";

describe("sameOrigin", () => {
  it("accepts the browser origin when Docker binds Next to 0.0.0.0", () => {
    const request = new NextRequest("http://0.0.0.0:3000/api/auth/login", {
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    });
    expect(sameOrigin(request)).toBe(true);
  });

  it("rejects cross-origin, missing-origin, and protocol-mismatched requests", () => {
    const url = "http://0.0.0.0:3000/api/auth/login";
    expect(
      sameOrigin(
        new NextRequest(url, {
          headers: { host: "localhost:3000", origin: "http://evil.test" },
        }),
      ),
    ).toBe(false);
    expect(
      sameOrigin(new NextRequest(url, { headers: { host: "localhost:3000" } })),
    ).toBe(false);
    expect(
      sameOrigin(
        new NextRequest(url, {
          headers: { host: "localhost:3000", origin: "https://localhost:3000" },
        }),
      ),
    ).toBe(false);
  });
});
