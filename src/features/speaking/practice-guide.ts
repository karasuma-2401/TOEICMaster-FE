import type { SpeakingDifficulty, SpeakingPart } from "./types";

/**
 * Parts with one question and nothing hidden from the learner. Parts 3 and 4
 * reveal each question only when its turn comes, so they stay on the timed run.
 */
export function isFreePracticePart(part: SpeakingPart) {
  return part === 1 || part === 2 || part === 5;
}

export const difficultyLabels: Record<SpeakingDifficulty, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Splits a passage into sentences marked for reading: `/` for a short pause at
 * a comma and `//` at the end of a sentence.
 */
export function markPauses(passage: string) {
  const sentences = passage.match(/[^.!?]+[.!?]*/g) ?? [];
  return sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .map((sentence) => `${sentence.replace(/,\s+/g, ", / ")} //`);
}

export const practiceIntro: Partial<Record<SpeakingPart, string>> = {
  1: "Luyện phát âm, trọng âm và ngữ điệu. Nói thử, nghe lại và tự tin tiến bộ.",
  2: "Luyện mô tả người, vật và hoạt động. Nói thử, nghe lại và tự tin tiến bộ.",
  5: "Luyện nêu quan điểm kèm lý do và ví dụ. Nói thử, nghe lại và tự tin tiến bộ.",
};

export const practiceTips: Partial<Record<SpeakingPart, string[]>> = {
  1: [
    "Đọc rõ âm cuối của từng từ.",
    "Lên giọng nhẹ ở phần liệt kê, hạ giọng cuối câu trần thuật.",
    "Giữ tốc độ đều, không ngắt giữa cụm danh từ.",
  ],
  2: [
    "Mở đầu bằng bối cảnh chung của bức tranh.",
    "Mô tả người và hành động trước, rồi đến đồ vật nổi bật.",
    "Dùng thì hiện tại tiếp diễn cho hành động đang diễn ra.",
  ],
  5: [
    "Nêu rõ quan điểm ngay trong câu đầu.",
    "Đưa hai lý do, mỗi lý do kèm một ví dụ cụ thể.",
    "Kết lại bằng một câu khẳng định quan điểm.",
  ],
};
