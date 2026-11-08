"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { currentQuestion } from "@/features/speaking/attempt";
import { useRecordingUploads } from "@/features/speaking/hooks/use-recording-uploads";
import { useSpeakingAttempt } from "@/features/speaking/hooks/use-speaking-attempt";
import { useVoiceRecorder } from "@/features/speaking/hooks/use-voice-recorder";
import { playBeep } from "../ui/beep";
import { AlertTriangleIcon, XIcon } from "../ui/icons";
import { SpPage } from "../ui/page";
import { SpError, SpLoading, SpeakingLogo } from "../ui/primitives";
import { SessionReview } from "./session-review";
import { SessionStage } from "./session-stage";

/** Runs a server-timed attempt: records each response and uploads it. */
export function SpeakingAttemptRun({ attemptId }: { attemptId: string }) {
  const router = useRouter();
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
  const phase = attempt?.status === "IN_PROGRESS" ? attempt.currentPhase : null;
  const respondingPosition =
    phase === "RESPONDING" ? (question?.position ?? null) : null;

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
  }, [recorder.micLost, recorder.status, respondingPosition, start, stop]);

  // The tone marks the live PREPARING → RESPONDING change, not a reload.
  const previousPhase = useRef(phase);
  useEffect(() => {
    if (previousPhase.current === "PREPARING" && phase === "RESPONDING")
      playBeep();
    previousPhase.current = phase;
  }, [phase]);

  if (!attempt)
    return (
      <SpPage>
        {session.error ? (
          <SpError
            message={session.error}
            onRetry={() => void session.refresh()}
          />
        ) : (
          <SpLoading label="Đang tải lượt làm Speaking…" />
        )}
      </SpPage>
    );

  if (attempt.status === "SUBMITTED")
    return (
      <SessionReview
        attempt={attempt}
        onRetry={uploads.retry}
        uploads={uploads.states}
      />
    );

  const exit = () => {
    if (
      window.confirm("Thoát phòng thi? Đồng hồ vẫn tiếp tục chạy trên máy chủ.")
    )
      router.push("/speaking");
  };
  const micDown =
    recorder.micLost ||
    recorder.status === "denied" ||
    recorder.status === "unsupported";

  return (
    <div className="sp-page flex flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 bg-(--sp-ink) text-white">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-2 md:px-6">
          <SpeakingLogo />
          <p className="text-sm text-white/70">
            {attempt.testTitle} · {attempt.testCode}
          </p>
          <button
            className="sp-btn sp-btn-sm border-white/30! text-white hover:bg-white/10"
            onClick={exit}
            type="button"
          >
            Thoát <XIcon size={15} />
          </button>
        </div>
        <ol aria-label="Tiến độ câu hỏi" className="flex gap-px">
          {attempt.questions.map((item) => {
            const position = question?.position ?? 1;
            return (
              <li
                aria-current={item.position === position ? "step" : undefined}
                className={`h-1.5 flex-1 ${item.position < position ? "bg-(--sp-brand)" : item.position === position ? "bg-(--sp-amber)" : "bg-white/20"}`}
                key={item.position}
              >
                <span className="sr-only">Câu {item.position}</span>
              </li>
            );
          })}
        </ol>
      </header>
      <main className="sp-container flex flex-1 flex-col pt-6">
        {micDown && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-(--sp-danger-line) bg-(--sp-danger-bg) p-4"
            role="alert"
          >
            <div className="flex items-center gap-3">
              <AlertTriangleIcon className="text-(--sp-danger)" size={24} />
              <div>
                <p className="font-semibold text-(--sp-danger)">
                  Không nhận được tín hiệu micro.
                </p>
                <p className="text-[13px] text-(--sp-danger)">
                  Đồng hồ vẫn tiếp tục chạy theo quy chế ETS!
                </p>
              </div>
            </div>
            {recorder.status !== "unsupported" && (
              <button
                className="sp-btn sp-btn-cta"
                onClick={() => void requestAccess()}
                type="button"
              >
                Kết nối lại
              </button>
            )}
          </div>
        )}
        {session.error && (
          <div className="mb-5">
            <SpError message={session.error} />
          </div>
        )}
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
          <SpLoading label="Đang đồng bộ với máy chủ…" />
        )}
      </main>
    </div>
  );
}
