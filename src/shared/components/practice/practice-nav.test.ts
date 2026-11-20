import { describe, expect, it } from "vitest";
import {
  activeNavKey,
  practiceNavGroups,
  practiceNavLinks,
} from "./practice-nav";

describe("activeNavKey", () => {
  it.each([
    ["/listening-reading", "exam-lr"],
    ["/listening", "exam-lr"],
    ["/reading", "exam-lr"],
    ["/exams/lr/123/attempt", "exam-lr"],
    ["/listening/practice/1", "exercise-lr"],
    ["/reading/practice/5/abc", "exercise-lr"],
    ["/speaking", "exam-speaking"],
    ["/speaking/tests/1", "exam-speaking"],
    ["/speaking/parts/2", "exercise-speaking"],
    ["/speaking/exercises/9/practice", "exercise-speaking"],
    ["/writing", "exam-writing"],
    ["/writing/tests/1", "exam-writing"],
    ["/writing/practice/3", "exercise-writing"],
    ["/pronunciation", "pronunciation"],
    ["/history", "history"],
    ["/history/writing", "history"],
  ])("%s → %s", (path, key) => {
    expect(activeNavKey(path)).toBe(key);
  });

  it("returns null for pages outside the sidebar", () => {
    expect(activeNavKey("/")).toBeNull();
    expect(activeNavKey("/profile")).toBeNull();
    expect(activeNavKey("/speakingx")).toBeNull();
    expect(activeNavKey(null)).toBeNull();
  });

  it("lists every skill under both exams and exercises", () => {
    for (const group of practiceNavGroups)
      expect(group.links.map((link) => link.label)).toEqual([
        "Listening & Reading",
        "Speaking",
        "Writing",
      ]);
    expect(practiceNavLinks.map((link) => link.label)).toEqual([
      "Phát âm",
      "Lịch sử",
    ]);
  });

  it("points each link at a path that activates it", () => {
    for (const link of [
      ...practiceNavGroups.flatMap((group) => group.links),
      ...practiceNavLinks,
    ])
      expect(activeNavKey(link.href)).toBe(link.key);
  });
});
