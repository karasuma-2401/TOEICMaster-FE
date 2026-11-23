import { describe, expect, it } from "vitest";
import {
  activeNavKey,
  practiceNavGroups,
  practiceNavLinks,
} from "./practice-nav";

describe("practice navigation", () => {
  it.each([
    ["/listening/practice", "exercise-lr"],
    ["/listening/practice/2", "exercise-lr"],
    ["/reading/practice", "exercise-lr"],
    ["/reading/practice/3/item", "exercise-lr"],
    ["/speaking/parts", "exercise-speaking"],
    ["/speaking/parts/2", "exercise-speaking"],
    ["/speaking/exercises", "exercise-speaking"],
    ["/speaking/exercises/abc", "exercise-speaking"],
    ["/writing/practice", "exercise-writing"],
    ["/writing/practice/1", "exercise-writing"],
    ["/listening-reading", "exam-lr"],
    ["/exams/lr/123", "exam-lr"],
    ["/speaking", "exam-speaking"],
    ["/writing", "exam-writing"],
    ["/flashcards", "flashcards"],
    ["/flashcards/office-operations", "flashcards"],
    ["/pronunciation", "pronunciation"],
    ["/pronunciation/ipa", "pronunciation"],
    ["/history", "history"],
    ["/history/writing", "history"],
    ["/", null],
    ["/profile", null],
    ["/admin", null],
    ["/login", null],
    ["/register", null],
    ["", null],
    [null, null],
  ])("matches %s to %s", (pathname, expected) => {
    expect(activeNavKey(pathname)).toBe(expected);
  });

  it("exposes grouped exam/exercise sections and standalone links", () => {
    expect(practiceNavGroups.map((group) => group.label)).toEqual([
      "Exams",
      "Exercises",
    ]);
    expect(practiceNavLinks.map((link) => [link.label, link.href])).toEqual([
      ["Knowledge", "/knowledge"],
      ["Flashcards", "/flashcards"],
      ["Pronunciation", "/pronunciation"],
      ["History", "/history"],
    ]);
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
        "/knowledge",
        "/flashcards",
        "/pronunciation",
        "/history",
      ]),
    );
  });
});
