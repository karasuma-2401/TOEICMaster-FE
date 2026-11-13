import type { LrPartId, LrPartSpec, LrSection } from "./types";

export const LR_TOTAL_QUESTIONS = 200;
export const LISTENING_LAST = 100;

export const LR_PARTS: readonly LrPartSpec[] = [
  {
    id: 1,
    section: "listening",
    first: 1,
    last: 6,
    title: "Photographs",
    reportTitle: "Photographs",
  },
  {
    id: 2,
    section: "listening",
    first: 7,
    last: 31,
    title: "Question - Response",
    reportTitle: "Question–Response",
  },
  {
    id: 3,
    section: "listening",
    first: 32,
    last: 70,
    title: "Short Conversations",
    reportTitle: "Conversations",
  },
  {
    id: 4,
    section: "listening",
    first: 71,
    last: 100,
    title: "Short Talks",
    reportTitle: "Talks",
  },
  {
    id: 5,
    section: "reading",
    first: 101,
    last: 130,
    title: "Incomplete Sentences",
    reportTitle: "Incomplete Sentences",
  },
  {
    id: 6,
    section: "reading",
    first: 131,
    last: 146,
    title: "Text Completion",
    reportTitle: "Text Completion",
  },
  {
    id: 7,
    section: "reading",
    first: 147,
    last: 200,
    title: "Reading Comprehension",
    reportTitle: "Reading Comprehension",
  },
];

export function partSpec(id: LrPartId): LrPartSpec {
  const spec = LR_PARTS.find((part) => part.id === id);
  if (!spec) throw new Error(`Unknown TOEIC part ${id}`);
  return spec;
}

export function partForQuestion(number: number): LrPartSpec | undefined {
  return LR_PARTS.find((part) => number >= part.first && number <= part.last);
}

export function sectionForQuestion(number: number): LrSection {
  return number <= LISTENING_LAST ? "listening" : "reading";
}

export function partsInSection(section: LrSection): LrPartSpec[] {
  return LR_PARTS.filter((part) => part.section === section);
}
