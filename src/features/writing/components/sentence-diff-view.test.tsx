// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { computeWordDiff, SentenceDiffView } from "./sentence-diff-view";

afterEach(cleanup);

describe("computeWordDiff", () => {
  it("identifies equal, removed, and added words accurately", () => {
    const tokens = computeWordDiff(
      "She go to the office yesterday.",
      "She went to the main office yesterday.",
    );

    const removed = tokens
      .filter((token) => token.type === "removed")
      .map((token) => token.text.trim())
      .filter(Boolean);
    const added = tokens
      .filter((token) => token.type === "added")
      .map((token) => token.text.trim())
      .filter(Boolean);
    const equalWords = tokens
      .filter((token) => token.type === "equal")
      .flatMap((token) => token.text.trim().split(/\s+/))
      .filter(Boolean);

    expect(removed).toEqual(["go"]);
    expect(added).toEqual(["went", "main"]);
    expect(equalWords).toEqual(["She", "to", "the", "office", "yesterday."]);
  });

  it("handles identical sentences without removed or added tokens", () => {
    const tokens = computeWordDiff(
      "Please review the attached schedule.",
      "Please review the attached schedule.",
    );

    expect(tokens.some((token) => token.type === "removed")).toBe(false);
    expect(tokens.some((token) => token.type === "added")).toBe(false);
    expect(
      tokens
        .map((token) => token.text)
        .join("")
        .trim(),
    ).toBe("Please review the attached schedule.");
  });
});

describe("SentenceDiffView", () => {
  it("renders accessible diff region highlighting removals and additions", () => {
    render(
      <SentenceDiffView
        original="I am writing for ask about the meeting."
        suggested="I am writing to ask about the weekly meeting."
      />,
    );

    const region = screen.getByTestId("writing-sentence-diff");
    expect(region).toHaveAttribute("role", "region");
    expect(region).toHaveAccessibleName(
      "Sentence comparison and suggested revision",
    );

    const delElement = region.querySelector("del");
    const insElements = Array.from(region.querySelectorAll("ins"));

    expect(delElement).toHaveTextContent("for");
    expect(insElements.map((el) => el.textContent?.trim())).toEqual([
      "to",
      "weekly",
    ]);
  });
});
