import { afterEach, expect, it, vi } from "vitest";
import {
  archiveWritingTest,
  deleteWritingTestDraft,
  restoreWritingTest,
} from "./admin-api";

afterEach(() => vi.unstubAllGlobals());

it("sends versioned lifecycle requests to the same-origin admin API", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json({ status: "ARCHIVED" }))
    .mockResolvedValueOnce(Response.json({ status: "PUBLISHED" }));
  vi.stubGlobal("fetch", fetchMock);
  await deleteWritingTestDraft("id-1", 2);
  await archiveWritingTest("id-1", 3);
  await restoreWritingTest("id-1", 4);
  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    "/api/admin/writing/tests/id-1?version=2",
    expect.objectContaining({ method: "DELETE" }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    "/api/admin/writing/tests/id-1/archive",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ version: 3 }),
    }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    3,
    "/api/admin/writing/tests/id-1/restore",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ version: 4 }),
    }),
  );
});
