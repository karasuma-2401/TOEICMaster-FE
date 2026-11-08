import type { SpeakingAttemptQuestion } from "@/features/speaking/attempt";
import { speakingPartSpecs } from "@/features/speaking/part-specs";

/** One-line description of what the learner answered at a position. */
export function stepSummary(question: SpeakingAttemptQuestion) {
  const { content } = question;
  if (content.part === 3 || content.part === 4)
    return content.questions[question.questionIndex] ?? "Câu hỏi";
  if (content.part === 5) return content.prompt;
  return speakingPartSpecs[content.part].subtitle;
}
