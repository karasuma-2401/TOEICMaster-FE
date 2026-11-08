import {
  phaseLength,
  type SpeakingAttemptQuestion,
  type SpeakingPhase,
} from "@/features/speaking/attempt";
import type { MicrophoneStatus } from "@/features/speaking/hooks/use-voice-recorder";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { SpeakingPrompt } from "../prompts/speaking-prompt";
import { formatClock } from "../ui/format";
import { MicOffIcon } from "../ui/icons";
import { Waveform } from "../ui/primitives";
import { phaseCopy } from "./phase-copy";

const order: SpeakingPhase[] = ["READING", "PREPARING", "RESPONDING"];
const trackLabel: Record<SpeakingPhase, string> = {
  READING: "Đọc",
  PREPARING: "Chuẩn bị",
  RESPONDING: "Trả lời",
};

/** The phases of one question as a track; the active one fills as time runs. */
function PhaseTrack({
  question,
  phase,
  seconds,
}: {
  question: SpeakingAttemptQuestion;
  phase: SpeakingPhase;
  seconds: number;
}) {
  const steps = order.filter((item) => phaseLength(question, item) > 0);
  return (
    <div className="flex gap-1">
      {steps.map((step) => {
        const length = phaseLength(question, step);
        const distance = order.indexOf(step) - order.indexOf(phase);
        const fill =
          distance < 0
            ? 100
            : distance > 0
              ? 0
              : Math.min(100, ((length - seconds) / length) * 100);
        const color =
          step === "RESPONDING" ? "bg-(--sp-rec)" : "bg-(--sp-timer)";
        return (
          <div className="min-w-16" key={step} style={{ flexGrow: length }}>
            <p
              className={`mb-1 text-xs ${distance === 0 ? "font-semibold" : "text-(--sp-ink-3)"}`}
            >
              {trackLabel[step]} · {length}s
            </p>
            <div className="h-1.5 bg-(--sp-track)">
              <div
                className={`h-full transition-[width] duration-300 ${color}`}
                style={{ width: `${fill}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The active question: TOEIC prompt above a fixed dock with state and controls. */
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
  const responding = phase === "RESPONDING";
  const live = responding && micStatus === "ready" && recording;
  const skipLabel = responding && isLast ? "Xong, nộp bài →" : copy.skipLabel;
  const spec = speakingPartSpecs[question.part];
  return (
    <>
      <p className="sp-overline text-(--sp-ink-3)">
        Part {question.part} · {spec.title}
      </p>
      <h1 className="mt-1 text-[28px] font-bold leading-9">
        Question {question.position} of {total}
      </h1>
      <section className="mt-4 flex-1 rounded-lg border border-(--sp-line) bg-(--sp-surface) p-7">
        <SpeakingPrompt
          content={question.content}
          questionIndex={question.questionIndex}
          recording={live}
          revealQuestion={phase !== "READING"}
          showDirections={false}
        />
      </section>

      <div className="sticky bottom-0 mx-[calc(50%-50vw)] mt-5 border-t border-(--sp-line) bg-(--sp-surface) px-[calc(50vw-50%)] py-3">
        <PhaseTrack phase={phase} question={question} seconds={seconds} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div aria-live="polite" className="flex min-w-48 items-center gap-3">
            {live ? (
              <>
                <span className="size-3 animate-pulse rounded-full bg-(--sp-rec)" />
                <span className="text-sm font-semibold text-(--sp-rec)">
                  Đang ghi âm
                </span>
                <Waveform
                  bars={12}
                  className="text-(--sp-rec)"
                  height={24}
                  level={Math.max(level, 0.25)}
                />
              </>
            ) : (
              <>
                <MicOffIcon className="text-(--sp-ink-3)" />
                <span className="text-sm text-(--sp-ink-2)">
                  {responding ? "Không ghi âm" : `${copy.label} · Micro tắt`}
                </span>
              </>
            )}
          </div>
          <p
            className={`sp-mono text-[40px] font-semibold leading-none ${responding ? "text-(--sp-rec)" : "text-(--sp-ink)"}`}
          >
            {formatClock(seconds)}
          </p>
          <button
            className={`sp-btn sp-btn-lg min-w-52 ${responding ? "sp-btn-cta" : "sp-btn-outline"}`}
            disabled={busy}
            onClick={onSkip}
            type="button"
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </>
  );
}
