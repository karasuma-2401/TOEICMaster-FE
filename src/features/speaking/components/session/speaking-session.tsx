"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getSpeakingTest,
  startSpeakingAttempt,
  type SpeakingTestSummary,
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

/** Pre-attempt screen: microphone check, then creates a server attempt. */
export function SpeakingSession({
  testId,
  mode,
}: {
  testId: string;
  mode?: string;
}) {
  const router = useRouter();
  const recorder = useVoiceRecorder();
  const [test, setTest] = useState<SpeakingTestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const selectedMode = modeFromRoute(mode);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        setTest(await getSpeakingTest(testId, signal));
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải đề Speaking.",
          );
      }
    },
    [testId],
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
      const attempt = await startSpeakingAttempt(testId, selectedMode);
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

  if (!test)
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

  const parts = test.parts.filter((part) =>
    modeParts(selectedMode).includes(part.part),
  );
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
              <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
                {test.code} · {displaySpeakingMode(selectedMode).toUpperCase()}
              </p>
              <h1 className="mt-2 text-xl font-bold">{test.title}</h1>
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
