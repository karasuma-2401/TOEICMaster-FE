"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getSpeakingExercise,
  getSpeakingTest,
  startSpeakingAttempt,
  startSpeakingExercisePractice,
  type SpeakingPartSummary,
} from "@/features/speaking/api";
import { useVoiceRecorder } from "@/features/speaking/hooks/use-voice-recorder";
import {
  displaySpeakingMode,
  modeFromRoute,
  modeParts,
} from "@/features/speaking/practice";
import { SpPage } from "../ui/page";
import { SpError, SpLoading } from "../ui/primitives";
import { MicCheckPanel } from "./mic-check-panel";

/** What the session runs: a published test in a mode, or one exercise (Part practice). */
export type SpeakingSessionSource =
  | { kind: "test"; testId: string; mode?: string }
  | { kind: "exercise"; exerciseId: string };

interface SessionInfo {
  code: string;
  title: string;
  label: string;
  backHref: string;
  parts: SpeakingPartSummary[];
}

async function loadInfo(
  source: SpeakingSessionSource,
  signal?: AbortSignal,
): Promise<SessionInfo> {
  if (source.kind === "exercise") {
    const exercise = await getSpeakingExercise(source.exerciseId, signal);
    return {
      code: exercise.code,
      title: exercise.topic,
      label: `Luyện Part ${exercise.part}`,
      backHref: `/speaking/parts/${exercise.part}`,
      parts: [
        {
          part: exercise.part,
          questionCount: exercise.questionCount,
          durationSeconds: exercise.durationSeconds,
        },
      ],
    };
  }
  const test = await getSpeakingTest(source.testId, signal);
  const mode = modeFromRoute(source.mode);
  return {
    code: test.code,
    title: test.title,
    label: displaySpeakingMode(mode),
    backHref: "/speaking",
    parts: test.parts.filter((part) => modeParts(mode).includes(part.part)),
  };
}

/** Pre-attempt screen: microphone check, then creates a server attempt. */
export function SpeakingSession({ source }: { source: SpeakingSessionSource }) {
  const router = useRouter();
  const recorder = useVoiceRecorder();
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const sourceId = source.kind === "test" ? source.testId : source.exerciseId;
  const sourceMode = source.kind === "test" ? source.mode : undefined;
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        setInfo(
          await loadInfo(
            source.kind === "test"
              ? { kind: "test", testId: sourceId, mode: sourceMode }
              : { kind: "exercise", exerciseId: sourceId },
            signal,
          ),
        );
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải nội dung Speaking.",
          );
      }
    },
    [source.kind, sourceId, sourceMode],
  );
  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load]);

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const attempt =
        source.kind === "test"
          ? await startSpeakingAttempt(
              source.testId,
              modeFromRoute(source.mode),
            )
          : await startSpeakingExercisePractice(source.exerciseId);
      router.push(`/speaking/attempts/${encodeURIComponent(attempt.id)}`);
    } catch (cause) {
      setStartError(
        cause instanceof Error
          ? cause.message
          : "Không thể bắt đầu lượt làm Speaking.",
      );
      setStarting(false);
    }
  };

  const { status, monitor, requestAccess } = recorder;
  useEffect(() => {
    const task = window.setTimeout(() => void requestAccess(), 0);
    return () => window.clearTimeout(task);
  }, [requestAccess]);
  useEffect(() => {
    if (status === "ready") monitor();
  }, [monitor, status]);

  if (!info)
    return (
      <SpPage narrow>
        {error ? (
          <SpError message={error} onRetry={() => void load()} />
        ) : (
          <SpLoading label="Đang chuẩn bị lượt luyện Speaking…" />
        )}
      </SpPage>
    );

  return (
    <SpPage narrow>
      <div className="mx-auto max-w-[640px] pt-4 text-center">
        <p className="sp-overline text-(--sp-brand)">
          {info.code} · {info.label}
        </p>
        <h1 className="mt-2 text-[32px] font-bold leading-10 tracking-[-0.01em]">
          {info.title}
        </h1>
        <p className="mb-6 mt-1 text-(--sp-ink-2)">
          Kiểm tra micro một lần rồi vào bài ngay.
        </p>
      </div>
      {startError && (
        <div className="mb-4">
          <SpError message={startError} />
        </div>
      )}
      <MicCheckPanel
        deviceLabel={recorder.deviceLabel}
        level={recorder.level}
        onRequestAccess={() => void recorder.requestAccess()}
        onStart={() => void start()}
        requireDevices={source.kind === "test"}
        starting={starting}
        status={recorder.status}
      />
    </SpPage>
  );
}
