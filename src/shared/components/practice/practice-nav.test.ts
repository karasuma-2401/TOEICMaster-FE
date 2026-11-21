import { describe, expect, it } from "vitest";
import {
  activeNavKey,
  practiceNavGroups,
  practiceNavLinks,
} from "./practice-nav";

describe("practice navigation", () => {
  it.each([
    ["/listening/practice/2", "exercise-lr"],
    ["/reading/practice/3/item", "exercise-lr"],
    ["/speaking/parts/2", "exercise-speaking"],
    ["/speaking/exercises/abc", "exercise-speaking"],
    ["/writing/practice/1", "exercise-writing"],
    ["/listening-reading", "exam-lr"],
    ["/exams/lr/123", "exam-lr"],
    ["/speaking", "exam-speaking"],
    ["/writing", "exam-writing"],
    ["/pronunciation", "pronunciation"],
    ["/history/writing", "history"],
    ["/", null],
    ["/profile", null],
    [null, null],
  ])("matches %s to %s", (pathname, expected) => {
    expect(activeNavKey(pathname)).toBe(expected);
  });

  it("keeps every navigation link uniquely addressable", () => {
    const links = [
      ...practiceNavGroups.flatMap((group) => group.links),
      ...practiceNavLinks,
    ];

    expect(new Set(links.map((link) => link.key)).size).toBe(links.length);
    expect(links.map((link) => link.href)).toEqual(
      expect.arrayContaining([
        "/listening-reading",
        "/listening/practice/1",
        "/speaking",
        "/speaking/parts/1",
        "/writing",
        "/writing/practice/1",
        "/pronunciation",
        "/history",
      ]),
    );
  });
});
