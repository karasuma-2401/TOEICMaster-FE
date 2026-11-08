import { describe, expect, it } from "vitest";
import { mascotGuide } from "./mascot-tips";

describe("mascotGuide", () => {
  it("picks the most specific guide for a page", () => {
    expect(mascotGuide("/speaking/parts/2")?.title).toBe("Luyện theo Part");
    expect(mascotGuide("/speaking/tests/a/practice")?.title).toBe(
      "Kiểm tra micro",
    );
    expect(mascotGuide("/speaking")?.title).toBe("Trang Speaking");
  });

  it("stays out of the way during a timed attempt", () => {
    expect(mascotGuide("/speaking/attempts/a")).toBeNull();
    expect(mascotGuide("/writing/attempts/a")).toBeNull();
    expect(mascotGuide("/writing/attempts/a/result")).not.toBeNull();
  });
});
