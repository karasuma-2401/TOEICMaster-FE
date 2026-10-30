import { describe, expect, it } from "vitest";
import {
  mediaUrl,
  parseExercise,
  parseTestDetail,
  parseTestListItem,
} from "./parsers";
import {
  exerciseDto,
  ids,
  testDetailDto,
  testListItemDto,
} from "./testing/fixtures";

describe("Speaking parsers", () => {
  it("parses every Part and builds same-origin image URLs", () => {
    for (const part of [1, 2, 3, 4, 5] as const)
      expect(parseExercise(exerciseDto(part)).part).toBe(part);
    expect(parseExercise(exerciseDto(2))).toMatchObject({
      imageAssetId: ids.image,
      imageUrl: `/api/admin/speaking/media/${ids.image}`,
    });
    expect(mediaUrl("public", "a b")).toBe("/api/speaking/media/a%20b");
  });

  it("rejects unexpected shapes with a 502 error", () => {
    expect(() =>
      parseExercise({ ...exerciseDto(3), questions: ["one"] }),
    ).toThrow(expect.objectContaining({ status: 502 }));
    expect(() => parseExercise(exerciseDto(1, { difficulty: "Dễ" }))).toThrow();
    expect(() =>
      parseExercise(exerciseDto(1, { passage: undefined })),
    ).toThrow();
  });

  it("orders test slots by sequence number per Part", () => {
    const dto = testDetailDto();
    dto.exercises.reverse();
    const { test, exercises } = parseTestDetail(dto);

    expect(test.exerciseIds[1]).toEqual([ids.exercise(11), ids.exercise(12)]);
    expect(test.exerciseIds[2]).toEqual([ids.exercise(21)]);
    expect(exercises).toHaveLength(3);
  });

  it("reads list part counts keyed by Part number", () => {
    expect(parseTestListItem(testListItemDto()).partCounts).toEqual({
      1: 2,
      2: 2,
      3: 1,
      4: 1,
      5: 1,
    });
    expect(() =>
      parseTestListItem(testListItemDto({ partCounts: { "1": 2 } })),
    ).toThrow();
  });
});
