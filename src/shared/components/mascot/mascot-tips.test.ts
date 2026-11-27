import { describe, expect, it } from "vitest";
import { mascotGuide } from "./mascot-tips";

describe("mascotGuide", () => {
  it("picks the most specific guide for standard pages", () => {
    expect(mascotGuide("/speaking/tests/a/practice")?.title).toBe(
      "Check your microphone",
    );
    expect(mascotGuide("/speaking")?.title).toBe("Speaking Page");
    expect(mascotGuide("/flashcards")?.title).toBe("Quick Flashcard Study");
    expect(mascotGuide("/history")?.title).toBe("Learning History");
    expect(mascotGuide("/")?.title).toBe("Hi there, I'm Mic!");
  });

  it("suppresses the mascot on active exam, attempt, and practice routes", () => {
    expect(mascotGuide("/exams/lr/attempts/a")).toBeNull();
    expect(mascotGuide("/exams/lr/attempts/a/attempt")).toBeNull();
    expect(mascotGuide("/exams/lr/exam-1/attempt")).toBeNull();
    expect(mascotGuide("/speaking/attempts/a")).toBeNull();
    expect(mascotGuide("/writing/attempts/a")).toBeNull();
    expect(mascotGuide("/listening/practice/1")).toBeNull();
    expect(mascotGuide("/listening/practice/1/item-1")).toBeNull();
    expect(mascotGuide("/reading/practice/5")).toBeNull();
    expect(mascotGuide("/reading/practice/5/item-1")).toBeNull();
    expect(mascotGuide("/speaking/parts/2")).toBeNull();
    expect(mascotGuide("/writing/parts/1")).toBeNull();
  });
});
