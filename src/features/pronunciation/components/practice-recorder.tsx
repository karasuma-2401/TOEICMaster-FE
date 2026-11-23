"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ErrorPanel,
  InlineError,
} from "@/shared/components/practice/state-panels";
import {
  primaryAction,
  secondaryAction,
  textLink,
} from "@/shared/components/practice/styles";
import { assessPronunciation, PronunciationApiError } from "../api";
import {
  scoreTargetPhoneme,
  type PronunciationAssessment,
} from "../assessment";
import {
  usePronunciationRecorder,
  type Take,
} from "../hooks/use-pronunciation-recorder";
import type { IpaExample, IpaSound } from "../ipa-sounds";
import { toWav16kMono } from "../wav";
import { AssessmentResult } from "./assessment-result";
import { Transcription } from "./example-word-list";
import { MicIcon, StopIcon } from "./icons";
import { TakePlayback } from "./take-playback";

/** Takes shorter or quieter than this are not worth sending to the assessor. */
const minTakeMs = 300;
const minPeakLevel = 0.04;

type Assessment =
  | { kind: "none" }
  | { kind: "silent" }
  | { kind: "assessing" }
  | { kind: "result"; result: PronunciationAssessment }
  | { kind: "error"; error: PronunciationApiError };

export function PracticeRecorder({
  sound,
  example,
  onAssessed,
}: {
  sound: IpaSound;
  example: IpaExample;
  onAssessed: (slug: string) => void;
}) {
  const word = example.word;
  const [assessment, setAssessment] = useState<Assessment>({ kind: "none" });
  const [attempts, setAttempts] = useState<number[]>([]);
  const request = useRef<AbortController | null>(null);
  const wordRef = useRef(word);

  const send = useCallback(
    async (take: Take) => {
      request.current?.abort();
      if (take.durationMs < minTakeMs || take.peakLevel < minPeakLevel) {
        setAssessment({ kind: "silent" });
        return;
      }
      const controller = new AbortController();
      request.current = controller;
      setAssessment({ kind: "assessing" });
      try {
        // 16 kHz mono WAV is what the assessor needs; fall back to the raw take.
        const audio = (await toWav16kMono(take.blob)) ?? take.blob;
        if (controller.signal.aborted) return;
        const result = await assessPronunciation(
          audio,
          wordRef.current,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setAssessment({ kind: "result", result });
        if (result.recognitionStatus === "Recognized") {
          const target = scoreTargetPhoneme(result, sound);
          const value = target?.score ?? Math.round(result.accuracyScore);
          setAttempts((current) => [...current, value].slice(-3));
          onAssessed(sound.slug);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setAssessment({
          kind: "error",
          error:
            error instanceof PronunciationApiError
              ? error
              : new PronunciationApiError(
                  "UNAVAILABLE",
                  "Unable to score right now.",
                ),
        });
      } finally {
        if (request.current === controller) request.current = null;
      }
    },
    [onAssessed, sound],
  );

  const recorder = usePronunciationRecorder({ onTake: send });
  const { discard } = recorder;

  // Switching to another example word drops the old take and any pending request.
  useEffect(() => {
    if (wordRef.current === word) return;
    wordRef.current = word;
    request.current?.abort();
    discard();
    setAssessment({ kind: "none" });
  }, [word, discard]);

  useEffect(() => () => request.current?.abort(), []);

  function cancel() {
    request.current?.abort();
    request.current = null;
    setAssessment({ kind: "none" });
  }

  function retake() {
    cancel();
    void recorder.start();
  }

  const { status, take } = recorder;
  const recording = status === "recording";
  const assessing = assessment.kind === "assessing";
  const busy = status === "requesting" || assessing;
  const seconds = (recorder.elapsedMs / 1000).toFixed(1);

  return (
    <section aria-labelledby="ipa-practice-heading">
      <h3 className="text-[15px] font-semibold" id="ipa-practice-heading">
        Practice
      </h3>
      <p className="mt-1 text-[15px] text-(--sp-ink-2)">
        Say the word <span className="text-(--sp-ink)">{word}</span>{" "}
        <Transcription example={example} />
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {recording ? (
          <>
            <button
              className={primaryAction}
              onClick={recorder.stop}
              type="button"
            >
              <StopIcon />
              Stop
            </button>
            <span className="inline-flex items-center gap-2 text-[13px] text-(--sp-ink-2)">
              <span
                aria-hidden="true"
                className="size-2.5 animate-pulse rounded-full bg-(--sp-rec)"
              />
              Recording {seconds}s / {recorder.maxMs / 1000}s
            </span>
            <span
              aria-hidden="true"
              className="h-1.5 w-24 overflow-hidden rounded-full bg-(--sp-subtle)"
            >
              <span
                className="block h-full rounded-full bg-(--sp-brand) transition-[width] duration-75"
                style={{ width: `${Math.round(recorder.level * 100)}%` }}
              />
            </span>
          </>
        ) : assessing ? (
          <>
            <span className="inline-flex items-center gap-2 text-[13px] text-(--sp-ink-2)">
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-(--sp-line) border-t-(--sp-brand)"
              />
              Scoring pronunciation…
            </span>
            <button className={secondaryAction} onClick={cancel} type="button">
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className={primaryAction}
              disabled={busy || status === "unsupported"}
              onClick={take ? retake : () => void recorder.start()}
              type="button"
            >
              <MicIcon />
              {take ? "Record again" : "Record"}
            </button>
            <span aria-live="polite" className="text-[13px] text-(--sp-ink-2)">
              {status === "requesting"
                ? "Requesting microphone access…"
                : "Up to 5 seconds"}
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 empty:hidden">
        {status === "denied" && (
          <InlineError>
            Microphone access is not allowed in your browser. Click the lock
            icon next to the address bar, enable Microphone permission, and try
            again.
          </InlineError>
        )}
        {status === "unsupported" && (
          <InlineError>
            Your browser does not support audio recording. You can still listen
            to the sample sound and example words.
          </InlineError>
        )}
        {status === "mic-lost" && (
          <InlineError>
            Microphone disconnected. Check your device and click Record.
          </InlineError>
        )}
        {assessment.kind === "silent" && (
          <InlineError>
            No voice detected. Please try again closer to the microphone.
          </InlineError>
        )}
        {take && !recording && (
          <TakePlayback
            durationSeconds={take.durationMs / 1000}
            key={take.url}
            url={take.url}
          />
        )}
        {assessment.kind === "result" && (
          <div aria-live="polite">
            <AssessmentResult assessment={assessment.result} sound={sound} />
          </div>
        )}
        {assessment.kind === "error" && (
          <ErrorBlock
            error={assessment.error}
            onRetry={take ? () => void send(take) : undefined}
            slug={sound.slug}
          />
        )}
        {attempts.length > 1 && (
          <p className="text-[13px] text-(--sp-ink-2)">
            Recent attempts: {attempts.map((value) => `${value}%`).join(" → ")}
          </p>
        )}
      </div>
    </section>
  );
}

function ErrorBlock({
  error,
  slug,
  onRetry,
}: {
  error: PronunciationApiError;
  slug: string;
  onRetry?: () => void;
}) {
  if (error.code === "UNAUTHORIZED") {
    return (
      <p className="rounded-xl bg-(--sp-subtle) px-3 py-2.5 text-sm text-(--sp-ink-2)">
        {error.message}{" "}
        <Link
          className={textLink}
          href={`/login?next=${encodeURIComponent(`/pronunciation?sound=${slug}`)}`}
        >
          Sign in
        </Link>
        . You can still play back your recording.
      </p>
    );
  }
  return (
    <div className="[&>div]:mt-0">
      <ErrorPanel
        message={error.message}
        onRetry={error.code === "RATE_LIMITED" ? undefined : onRetry}
        retryLabel="Try again"
      />
    </div>
  );
}
