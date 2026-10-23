import { describe, expect, it } from "vitest";
import { parseExercise } from "./parsers";
import { publishChecklist } from "./publish-checklist";
import { exerciseDto, ids } from "./testing/fixtures";
import type { SpeakingExercise } from "./types";

const bank = new Map<string, SpeakingExercise>();
for (const [part, slots] of [
  [1, 2],
  [2, 2],
  [3, 1],
  [4, 1],
  [5, 1],
] as const)
  for (let slot = 1; slot <= slots; slot++) {
    const id = ids.exercise(part * 10 + slot);
    bank.set(id, parseExercise(exerciseDto(part, { id })));
  }
const lookup = (id: string) => bank.get(id);
const full = {
  code: "SPK",
  title: "Test",
  exerciseIds: {
    1: [ids.exercise(11), ids.exercise(12)],
    2: [ids.exercise(21), ids.exercise(22)],
    3: [ids.exercise(31)],
    4: [ids.exercise(41)],
    5: [ids.exercise(51)],
  },
};

describe("publishChecklist", () => {
  it("marks every requirement done for a complete test", () => {
    expect(publishChecklist(full, lookup).every((item) => item.done)).toBe(
      true,
    );
  });

  it("flags missing info, incomplete Parts, unpublished and duplicate slots", () => {
    bank.set(
      ids.exercise(31),
      parseExercise(exerciseDto(3, { id: ids.exercise(31), status: "DRAFT" })),
    );
    const pending = publishChecklist(
      {
        ...full,
        title: " ",
        exerciseIds: {
          ...full.exerciseIds,
          2: [ids.exercise(21), ids.exercise(21)],
          4: [],
        },
      },
      lookup,
    )
      .filter((item) => !item.done)
      .map((item) => item.id);

    expect(pending).toEqual(["info", "part-3", "part-4", "unique"]);
  });
});
