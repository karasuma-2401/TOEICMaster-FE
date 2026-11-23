import { describe, expect, it } from "vitest";
import { formatClock, formatMinutes, formatPhase } from "./format-time";

describe("format-time", () => {
  it("formats clocks and clamps negative values", () => {
    expect(formatClock(75)).toBe("01:15");
    expect(formatClock(-3)).toBe("00:00");
  });

  it("rounds minutes up and labels phases", () => {
    expect(formatMinutes(90)).toBe("2 min");
    expect(formatPhase(45)).toBe("45s");
    expect(formatPhase(60)).toBe("1 min");
    expect(formatPhase(90)).toBe("1 min 30s");
  });
});
