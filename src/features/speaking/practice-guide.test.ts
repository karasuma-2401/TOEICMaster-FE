import { describe, expect, it } from "vitest";
import { countWords, isFreePracticePart, markPauses } from "./practice-guide";

describe("practice guide", () => {
  it("offers free practice only where no question is hidden", () => {
    expect(
      [1, 2, 3, 4, 5].filter((part) => isFreePracticePart(part as 1)),
    ).toEqual([1, 2, 5]);
  });

  it("counts the words of a passage", () => {
    expect(countWords("  Welcome to the   garden tour. ")).toBe(5);
  });

  it("marks short pauses at commas and long pauses at sentence ends", () => {
    expect(
      markPauses("Photos are permitted, but flowers are not. Enjoy the tour!"),
    ).toEqual([
      "Photos are permitted, / but flowers are not. //",
      "Enjoy the tour! //",
    ]);
  });
});
