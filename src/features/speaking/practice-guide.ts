import type { SpeakingDifficulty, SpeakingPart } from "./types";

/**
 * Parts with one question and nothing hidden from the learner. Parts 3 and 4
 * reveal each question only when its turn comes, so they stay on the timed run.
 */
export function isFreePracticePart(part: SpeakingPart) {
  return part === 1 || part === 2 || part === 5;
}

export const difficultyLabels: Record<SpeakingDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
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
  1: "Practice pronunciation, word stress, and intonation. Speak, play back, and improve with confidence.",
  2: "Practice describing people, objects, and activities. Speak, play back, and improve with confidence.",
  5: "Practice expressing an opinion with reasons and examples. Speak, play back, and improve with confidence.",
};

export const practiceTips: Partial<Record<SpeakingPart, string[]>> = {
  1: [
    "Pronounce final consonants clearly.",
    "Use rising intonation slightly for lists and falling intonation at the end of statements.",
    "Keep a steady pace without pausing inside noun phrases.",
  ],
  2: [
    "Start with the overall scene of the picture.",
    "Describe the people and their actions first, then key objects.",
    "Use the present continuous tense for actions in progress.",
  ],
  5: [
    "State your opinion clearly in the opening sentence.",
    "Give two reasons, each supported by a specific example.",
    "Wrap up with a concluding sentence restating your opinion.",
  ],
};
