import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

const forwardMock = vi.hoisted(() => vi.fn());
vi.mock("@/features/user/server/profile-proxy", () => ({
  forward: forwardMock,
}));

import { PUT } from "./route";

function uploadRequest(file: File | string) {
  const form = new FormData();
  form.set("file", file);
  return new NextRequest("http://localhost/api/profile/avatar", {
    method: "PUT",
    headers: { Origin: "http://localhost" },
    body: form,
  });
}

describe("PUT /api/profile/avatar", () => {
  it("rejects missing or oversized upload files", async () => {
    const missing = new FormData();
    const missingRequest = new NextRequest(
      "http://localhost/api/profile/avatar",
      {
        method: "PUT",
        headers: { Origin: "http://localhost" },
        body: missing,
      },
    );
    expect((await PUT(missingRequest)).status).toBe(400);

    expect(
      (
        await PUT(
          uploadRequest(
            new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.png", {
              type: "image/png",
            }),
          ),
        )
      ).status,
    ).toBe(400);
    expect(forwardMock).not.toHaveBeenCalled();
  });

  it("forwards a valid File in multipart form without setting content-type", async () => {
    forwardMock.mockResolvedValueOnce(NextResponse.json({ ok: true }));
    const response = await PUT(
      uploadRequest(new File(["image"], "avatar.png", { type: "image/png" })),
    );
    expect(response.status).toBe(200);
    const [, path, init] = forwardMock.mock.calls[0] as [
      NextRequest,
      string,
      RequestInit,
    ];
    expect(path).toBe("/api/v1/users/me/avatar");
    expect(init.method).toBe("PUT");
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).toBeUndefined();
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
  });
});
