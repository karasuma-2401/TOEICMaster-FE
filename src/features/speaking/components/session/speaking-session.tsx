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
import { BackLink } from "@/shared/components/practice/page-intro";
import {
  PracticeColumns,
  PracticePage,
} from "@/shared/components/practice/practice-page";
import {
  ErrorPanel,
  InlineError,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import { surfaceCard } from "@/shared/components/practice/styles";
import { SpeakingHeader } from "../speaking-header";
import { MicCheckPanel } from "./mic-check-panel";
import { SessionProgress } from "./session-progress";

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

  if (!info)
    return (
      <PracticePage header={<SpeakingHeader />}>
        {error ? (
          <>
            <BackLink href="/speaking" label="Quay lại thư viện" />
            <ErrorPanel
              message={error}
              onRetry={() => void load()}
              retryLabel="Thử tải lại"
            />
          </>
        ) : (
          <LoadingPanel label="Đang chuẩn bị lượt luyện Speaking…" />
        )}
      </PracticePage>
    );

  const { parts } = info;
  const questionCount = parts.reduce(
    (sum, part) => sum + part.questionCount,
    0,
  );
  let position = 0;
  const placeholders = parts.flatMap((part) =>
    Array.from({ length: part.questionCount }, () => ({
      position: ++position,
      part: part.part,
      lockedAtUtc: null,
    })),
  );
  return (
    <PracticePage header={<SpeakingHeader />}>
      <PracticeColumns
        aside={
          <SessionProgress currentPosition={null} questions={placeholders} />
        }
        main={
          <section className={`p-5 sm:p-7 ${surfaceCard}`}>
            <div className="border-b border-slate-100 pb-5">
              <BackLink href={info.backHref} label="Quay lại" />
              <p className="mt-3 text-xs font-extrabold tracking-[0.14em] text-orange-600">
                {info.code} · {info.label.toUpperCase()}
              </p>
              <h1 className="mt-2 text-xl font-bold">{info.title}</h1>
            </div>
            <div className="mt-6 space-y-4">
              {startError && <InlineError>{startError}</InlineError>}
              <MicCheckPanel
                onRequestAccess={() => void recorder.requestAccess()}
                onStart={() => void start()}
                questionCount={questionCount}
                starting={starting}
                status={recorder.status}
                totalSeconds={parts.reduce(
                  (sum, part) => sum + part.durationSeconds,
                  0,
                )}
              />
            </div>
          </section>
        }
      />
    </PracticePage>
  );
}
