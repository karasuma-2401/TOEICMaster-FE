import type { MicrophoneStatus } from "@/features/speaking/hooks/use-voice-recorder";
import {
  phaseLength,
  type SpeakingAttemptQuestion,
  type SpeakingPhase,
} from "@/features/speaking/attempt";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { PhaseTimer } from "@/shared/components/practice/phase-timer";
import {
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { SpeakingPrompt } from "../prompts/speaking-prompt";
import { phaseCopy } from "./phase-copy";
import { RecorderStatus } from "./recorder-status";

/** The active question: phase timer, TOEIC prompt, recorder and controls. */
export function SessionStage({
  question,
  total,
  isLast,
  phase,
  seconds,
  busy,
  micStatus,
  recording,
  level,
  onSkip,
}: {
  question: SpeakingAttemptQuestion;
  total: number;
  isLast: boolean;
  phase: SpeakingPhase;
  seconds: number;
  busy: boolean;
  micStatus: MicrophoneStatus;
  recording: boolean;
  level: number;
  onSkip: () => void;
}) {
  const copy = phaseCopy[phase];
  const skipLabel =
    phase === "RESPONDING" && isLast ? "Hoàn tất và xem lại" : copy.skipLabel;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Câu {question.position}/{total}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">
            Part {question.part} · {speakingPartSpecs[question.part].subtitle}
          </p>
        </div>
        <PhaseTimer
          label={copy.label}
          seconds={seconds}
          tone={copy.tone}
          totalSeconds={phaseLength(question, phase)}
        />
      </div>
      <div className="mt-6">
        <SpeakingPrompt
          content={question.content}
          questionIndex={question.questionIndex}
          revealQuestion={phase !== "READING"}
          showDirections={question.questionIndex === 0}
        />
      </div>
      <div className="mt-6">
        <RecorderStatus
          level={level}
          micStatus={micStatus}
          recording={recording}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <p className="text-sm font-semibold text-slate-500">{copy.hint}</p>
        <button
          className={phase === "RESPONDING" ? primaryAction : secondaryAction}
          disabled={busy}
          onClick={onSkip}
          type="button"
        >
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
