"use client";

import { useEffect } from "react";
import { currentQuestion } from "@/features/speaking/attempt";
import { useRecordingUploads } from "@/features/speaking/hooks/use-recording-uploads";
import { useSpeakingAttempt } from "@/features/speaking/hooks/use-speaking-attempt";
import { useVoiceRecorder } from "@/features/speaking/hooks/use-voice-recorder";
import { displaySpeakingMode } from "@/features/speaking/practice";
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
import {
  secondaryAction,
  surfaceCard,
} from "@/shared/components/practice/styles";
import { SpeakingHeader } from "../speaking-header";
import { SessionProgress } from "./session-progress";
import { SessionReview } from "./session-review";
import { SessionStage } from "./session-stage";

/** Runs a server-timed attempt: records each response and uploads it. */
export function SpeakingAttemptRun({ attemptId }: { attemptId: string }) {
  const session = useSpeakingAttempt(attemptId);
  const recorder = useVoiceRecorder();
  const uploads = useRecordingUploads(
    attemptId,
    recorder.recordings,
    session.accept,
  );
  const { attempt } = session;
  const { requestAccess, start, stop } = recorder;
  const question = attempt ? currentQuestion(attempt) : null;
  const respondingPosition =
    attempt?.status === "IN_PROGRESS" && attempt.currentPhase === "RESPONDING"
      ? (question?.position ?? null)
      : null;

  // Permission granted on the start screen is remembered by the browser, so
  // this usually resolves without a prompt (also after a reload).
  useEffect(() => {
    const task = window.setTimeout(() => void requestAccess(), 0);
    return () => window.clearTimeout(task);
  }, [requestAccess]);

  useEffect(() => {
    if (respondingPosition === null || recorder.status !== "ready") return;
    start(respondingPosition);
    return () => stop();
  }, [recorder.status, respondingPosition, start, stop]);

  if (!attempt)
    return (
      <PracticePage header={<SpeakingHeader />}>
        {session.error ? (
          <>
            <BackLink href="/speaking" label="Quay lại thư viện" />
            <ErrorPanel
              message={session.error}
              onRetry={() => void session.refresh()}
              retryLabel="Thử tải lại"
            />
          </>
        ) : (
          <LoadingPanel label="Đang tải lượt làm Speaking…" />
        )}
      </PracticePage>
    );

  if (attempt.status === "SUBMITTED")
    return (
      <PracticePage header={<SpeakingHeader />}>
        <section className={`p-5 sm:p-8 ${surfaceCard}`}>
          <SessionReview
            attempt={attempt}
            localRecordings={recorder.recordings}
            onRetry={uploads.retry}
            uploads={uploads.states}
          />
        </section>
      </PracticePage>
    );

  return (
    <PracticePage header={<SpeakingHeader />}>
      <PracticeColumns
        aside={
          <SessionProgress
            currentPosition={attempt.currentQuestionPosition}
            questions={attempt.questions}
          />
        }
        main={
          <section className={`p-5 sm:p-7 ${surfaceCard}`}>
            <div className="border-b border-slate-100 pb-5">
              <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
                {attempt.testCode} ·{" "}
                {displaySpeakingMode(attempt.mode).toUpperCase()}
              </p>
              <h1 className="mt-2 text-xl font-bold">{attempt.testTitle}</h1>
            </div>
            {session.error && (
              <div className="mt-5">
                <InlineError>{session.error}</InlineError>
              </div>
            )}
            {recorder.status === "denied" ||
            recorder.status === "unsupported" ? (
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
                Micro chưa sẵn sàng nên câu trả lời sẽ không được ghi âm.
                {recorder.status === "denied" && (
                  <button
                    className={`ml-3 ${secondaryAction} min-h-9 px-3`}
                    onClick={() => void requestAccess()}
                    type="button"
                  >
                    Thử cấp quyền lại
                  </button>
                )}
              </p>
            ) : null}
            <div className="mt-6">
              {question && attempt.currentPhase ? (
                <SessionStage
                  busy={session.busy}
                  isLast={question.position === attempt.questions.length}
                  level={recorder.level}
                  micStatus={recorder.status}
                  onSkip={() => void session.skipPhase()}
                  phase={attempt.currentPhase}
                  question={question}
                  recording={recorder.recordingKey !== null}
                  seconds={session.seconds}
                  total={attempt.questions.length}
                />
              ) : (
                <LoadingPanel label="Đang đồng bộ với máy chủ…" />
              )}
            </div>
          </section>
        }
      />
    </PracticePage>
  );
}
