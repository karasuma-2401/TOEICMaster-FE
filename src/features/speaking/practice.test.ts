import { describe, expect, it } from "vitest";
import {
  displaySpeakingMode,
  modeFromRoute,
  modeParts,
  routeFromMode,
} from "./practice";

describe("Speaking practice modes", () => {
  it("maps route modes both ways and falls back to the full test", () => {
    expect(modeFromRoute("part-4")).toBe("PART_4");
    expect(modeFromRoute("part-9")).toBe("FULL");
    expect(modeFromRoute(undefined)).toBe("FULL");
    expect(routeFromMode("PART_2")).toBe("part-2");
    expect(displaySpeakingMode("FULL")).toBe("Full Test");
    expect(modeParts("PART_3")).toEqual([3]);
  });
});
