import { describe, expect, it } from "vitest";
import { nextVisits, parentPath } from "./navigation-history";

describe("nextVisits", () => {
  it("adds a new page", () => {
    expect(nextVisits(["/"], "/speaking")).toEqual(["/", "/speaking"]);
  });

  it("drops later pages when returning to an earlier one", () => {
    expect(nextVisits(["/", "/a", "/b"], "/a")).toEqual(["/", "/a"]);
  });

  it("ignores a repeat of the current page", () => {
    expect(nextVisits(["/", "/a"], "/a")).toEqual(["/", "/a"]);
  });
});

describe("parentPath", () => {
  it.each([
    ["/speaking", "/"],
    ["/speaking/parts/2", "/speaking"],
    ["/speaking/tests/t1", "/speaking"],
    ["/speaking/tests/t1/practice", "/speaking/tests/t1"],
    ["/speaking/exercises/e1/practice", "/speaking/parts/1"],
    ["/speaking/attempts/a1", "/speaking"],
    ["/speaking/attempts/a1/review/3", "/speaking/attempts/a1"],
    ["/writing", "/"],
    ["/writing/practice/1", "/writing"],
    ["/writing/attempts/a1", "/writing"],
    ["/writing/attempts/a1/result", "/history/writing"],
    ["/listening/practice/1", "/listening"],
    ["/reading/practice/5", "/reading"],
    ["/history/writing", "/"],
  ])("%s goes back to %s", (path, parent) => {
    expect(parentPath(path)).toBe(parent);
  });
});
