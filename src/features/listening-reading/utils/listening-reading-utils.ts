export const practiceParts = {
  listening: {
    1: { title: "Mô tả tranh", questions: 6 },
    2: { title: "Hỏi – đáp", questions: 25 },
    3: { title: "Đoạn hội thoại", questions: 39 },
    4: { title: "Bài nói ngắn", questions: 30 },
  },
  reading: {
    5: { title: "Hoàn thành câu", questions: 30 },
    6: { title: "Hoàn thành đoạn văn", questions: 16 },
    7: { title: "Đọc hiểu", questions: 54 },
  },
} as const;

export type Skill = keyof typeof practiceParts;

export function isListeningReadingPart(
  skill: Skill,
  part: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(
    practiceParts[skill],
    part,
  );
}