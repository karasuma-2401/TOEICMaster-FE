import { describe, expect, it } from "vitest";
import {
  fromSpeakingDraft,
  parseDocumentRows,
  previewFromDraft,
  toSpeakingDraft,
} from "./admin-draft";
import { parseExercise } from "./parsers";
import { exerciseDto } from "./testing/fixtures";

describe("Speaking admin draft", () => {
  it("round-trips every Part into the backend request body", () => {
    for (const part of [1, 2, 3, 4, 5] as const) {
      const exercise = parseExercise(exerciseDto(part));
      const result = fromSpeakingDraft(toSpeakingDraft(exercise));
      const { id, version, updatedAtUtc, ...expected } = exerciseDto(part);
      void [id, version, updatedAtUtc];
      expect(result).toEqual({ input: expected });
    }
  });

  it("keeps the id and version for updates and none for new drafts", () => {
    const exercise = parseExercise(exerciseDto(1));
    expect(toSpeakingDraft(exercise)).toMatchObject({
      id: exercise.id,
      version: 3,
    });
    expect(toSpeakingDraft(undefined, 2)).toMatchObject({ id: null, part: 2 });
  });

  it("parses Part 4 information rows and keeps pipes inside values", () => {
    expect(
      parseDocumentRows("9:00 | Opening\n\n Fee | $10 | members "),
    ).toEqual([
      { label: "9:00", value: "Opening" },
      { label: "Fee", value: "$10 | members" },
    ]);
  });

  it("reports missing required content", () => {
    const filled = { code: "SP", topic: "Work", modelAnswer: "Answer" };
    expect(fromSpeakingDraft(toSpeakingDraft(undefined, 1))).toEqual({
      error: "Mã bài và chủ đề là bắt buộc.",
    });
    expect(
      fromSpeakingDraft({
        ...toSpeakingDraft(undefined, 1),
        code: "SP",
        topic: "T",
      }),
    ).toEqual({ error: "Bài mẫu là bắt buộc để chấm và tự đánh giá." });
    expect(
      fromSpeakingDraft({
        ...toSpeakingDraft(undefined, 2),
        ...filled,
        imageAlt: "A photo",
      }),
    ).toEqual({ error: "Part 2 cần ảnh đã tải lên và mô tả ảnh." });
    expect(
      fromSpeakingDraft({
        ...toSpeakingDraft(undefined, 4),
        ...filled,
        documentTitle: "Agenda",
        documentRows: "missing separator",
      }),
    ).toEqual({
      error: "Part 4 cần tiêu đề và bảng thông tin dạng “nhãn | nội dung”.",
    });
  });

  it("builds a placeholder preview from an empty draft", () => {
    expect(previewFromDraft(toSpeakingDraft(undefined, 4))).toMatchObject({
      part: 4,
      documentTitle: "…",
      documentRows: [{ label: "…", value: "…" }],
      questions: ["…", "…", "…"],
    });
  });
});
