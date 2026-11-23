export const practiceParts = {
  listening: {
    1: { title: "Photographs", questions: 6 },
    2: { title: "Question - Response", questions: 25 },
    3: { title: "Short Conversations", questions: 39 },
    4: { title: "Short Talks", questions: 30 },
  },
  reading: {
    5: { title: "Incomplete Sentences", questions: 30 },
    6: { title: "Text Completion", questions: 16 },
    7: { title: "Reading Comprehension", questions: 54 },
  },
} as const;

export type Skill = keyof typeof practiceParts;

export function isListeningReadingPart(skill: Skill, part: string): boolean {
  return Object.prototype.hasOwnProperty.call(practiceParts[skill], part);
}
