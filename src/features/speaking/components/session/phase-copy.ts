import type { SpeakingPhase } from "@/features/speaking/attempt";
import type { PhaseTone } from "@/shared/components/practice/phase-timer";

export const phaseCopy: Record<
  SpeakingPhase,
  { label: string; tone: PhaseTone; hint: string; skipLabel: string }
> = {
  READING: {
    label: "Reading",
    tone: "prepare",
    hint: "Read the information carefully. The question will appear when reading time ends.",
    skipLabel: "Done reading →",
  },
  PREPARING: {
    label: "Preparing",
    tone: "prepare",
    hint: "Prepare your ideas. Your microphone will start automatically when preparation time ends.",
    skipLabel: "Ready, speak now →",
  },
  RESPONDING: {
    label: "Recording",
    tone: "recording",
    hint: "Speak loudly and clearly. The question will lock when time runs out.",
    skipLabel: "Done, next question →",
  },
};
