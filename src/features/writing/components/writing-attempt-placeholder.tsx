"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  flushWritingAnswerOnPageHide,
  getWritingAttempt,
  nextWritingQuestion,
  saveWritingAnswer,
  submitWritingAttempt,
  type WritingAttemptApi,
} from "@/features/writing/attempt-api";
import { ConfirmDialog } from "@/shared/components/practice/confirm-dialog";
import { PhaseTimer } from "@/shared/components/practice/phase-timer";
import {
  PracticeColumns,
  PracticePage,
} from "@/shared/components/practice/practice-page";
import { ProgressRail } from "@/shared/components/practice/progress-rail";
import {
  ErrorPanel,
  InlineError,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  eyebrow,
  primaryAction,
  surfaceCard,
  textLink,
} from "@/shared/components/practice/styles";
import { WritingHeader } from "./writing-header";
import { WritingQuestionPrompt } from "./writing-question-prompt";

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function WritingAttemptPlaceholder({
  attemptId,
}: {
  attemptId: string;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<WritingAttemptApi | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const refreshInFlight = useRef(false);
  const mutationRevision = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const queuedSaves = useRef(0);
  const autosaveTimer = useRef<number | null>(null);
  const pendingAutosave = useRef<{ position: number; answer: string } | null>(
    null,
  );

  const acceptAttempt = useCallback(
    (value: WritingAttemptApi) => {
      setServerOffset(Date.parse(value.serverNowUtc) - Date.now());
      setNow(Date.now());
      const pending = pendingAutosave.current;
      setAttempt(
        pending &&
          value.status === "IN_PROGRESS" &&
          value.currentPhase === "ANSWERING" &&
          value.currentQuestionPosition === pending.position
          ? {
              ...value,
              questions: value.questions.map((question) =>
                question.position === pending.position && !question.lockedAtUtc
                  ? { ...question, answer: pending.answer }
                  : question,
              ),
            }
          : value,
      );
      if (value.status === "SUBMITTED_AWAITING_EVALUATION")
        router.replace(
          `/writing/attempts/${encodeURIComponent(value.id)}/result`,
        );
    },
    [router],
  );
  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    const revision = mutationRevision.current;
    try {
      const result = await getWritingAttempt(attemptId);
      if (revision !== mutationRevision.current) return;
      acceptAttempt(result);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải lượt làm bài.",
      );
    } finally {
      refreshInFlight.current = false;
    }
  }, [acceptAttempt, attemptId]);
  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (
        attempt?.phaseEndsAtUtc &&
        Date.parse(attempt.phaseEndsAtUtc) <= tick + serverOffset
      )
        void refresh();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.phaseEndsAtUtc, refresh, serverOffset]);
  useEffect(
    () => () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    },
    [],
  );
  useEffect(() => {
    const flushPendingAnswer = () => {
      const pending = pendingAutosave.current;
      if (pending)
        void flushWritingAnswerOnPageHide(
          attemptId,
          pending.position,
          pending.answer,
        );
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushPendingAnswer();
    };
    window.addEventListener("pagehide", flushPendingAnswer);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flushPendingAnswer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [attemptId]);
  const closeConfirm = useCallback(() => setConfirming(false), []);
  const persistAnswer = useCallback(
    async (position: number, answer: string) => {
      queuedSaves.current++;
      setSaving(true);
      const save = saveQueue.current.then(async () => {
        try {
          const result = await saveWritingAnswer(attemptId, position, answer);
          mutationRevision.current++;
          acceptAttempt(result);
          if (
            pendingAutosave.current?.position === position &&
            pendingAutosave.current.answer === answer
          ) {
            pendingAutosave.current = null;
            setHasPendingSave(false);
          }
          setError(null);
          return true;
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể autosave bài viết.",
          );
          return false;
        }
      });
      saveQueue.current = save.then(() => undefined);
      try {
        return await save;
      } finally {
        queuedSaves.current--;
        if (queuedSaves.current === 0) setSaving(false);
      }
    },
    [acceptAttempt, attemptId],
  );
  if (!attempt)
    return (
      <PracticePage header={<WritingHeader />}>
        {error ? (
          <ErrorPanel
            message={error}
            onRetry={() => void refresh()}
            retryLabel="Thử tải lại"
          />
        ) : (
          <LoadingPanel label="Đang tải lượt làm Writing…" />
        )}
      </PracticePage>
    );

  const current =
    attempt.currentQuestionPosition === null
      ? null
      : (attempt.questions.find(
          (question) => question.position === attempt.currentQuestionPosition,
        ) ?? null);
  if (!current)
    return (
      <PracticePage header={<WritingHeader />}>
        <ErrorPanel message="Không tìm thấy câu đang làm." />
        <Link
          className={`mt-5 inline-block ${textLink}`}
          href="/history/writing"
        >
          Xem lịch sử
        </Link>
      </PracticePage>
    );

  const seconds = attempt.phaseEndsAtUtc
    ? Math.max(
        0,
        Math.ceil(
          (Date.parse(attempt.phaseEndsAtUtc) - (now + serverOffset)) / 1000,
        ),
      )
    : 0;
  const preparing = attempt.currentPhase === "PREPARING";
  const isLast = current.position === attempt.questions.length;
  const words = wordCount(current.answer);
  const saveLocalAnswer = (answer: string) => {
    setAttempt((value) =>
      value
        ? {
            ...value,
            questions: value.questions.map((question) =>
              question.position === current.position
                ? { ...question, answer }
                : question,
            ),
          }
        : value,
    );
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    pendingAutosave.current = { position: current.position, answer };
    setHasPendingSave(true);
    autosaveTimer.current = window.setTimeout(() => {
      void persistAnswer(current.position, answer);
    }, 800);
  };
  const next = async () => {
    setTransitioning(true);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    try {
      if (!(await persistAnswer(current.position, current.answer))) return;
      const result = await nextWritingQuestion(attemptId);
      mutationRevision.current++;
      acceptAttempt(result);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể chuyển câu tiếp theo.",
      );
      await refresh();
    } finally {
      setTransitioning(false);
    }
  };
  const submit = async () => {
    setConfirming(false);
    setTransitioning(true);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    try {
      if (
        !preparing &&
        !(await persistAnswer(current.position, current.answer))
      )
        return;
      const result = await submitWritingAttempt(attemptId);
      mutationRevision.current++;
      acceptAttempt(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể nộp bài.");
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <PracticePage header={<WritingHeader />}>
      <PracticeColumns
        aside={
          <ProgressRail
            groups={[
              {
                items: attempt.questions.map((question) => ({
                  id: question.position,
                  label: String(question.position),
                  state:
                    question.position === current.position
                      ? "current"
                      : question.lockedAtUtc
                        ? "done"
                        : "todo",
                })),
              },
            ]}
            hint="Câu đã khóa không thể mở lại."
          />
        }
        main={
          <section className={`p-5 sm:p-7 ${surfaceCard}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className={eyebrow}>
                  {attempt.testCode} · CÂU {current.position}/
                  {attempt.questions.length}
                </p>
                <h1 className="mt-2 text-xl font-bold">{attempt.testTitle}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Writing Part {current.part}
                </p>
              </div>
              {attempt.isPractice ? (
                <span className="text-sm text-slate-600">
                  Luyện tập không giới hạn thời gian
                </span>
              ) : (
                <PhaseTimer
                  label={preparing ? "Chuẩn bị" : "Làm bài"}
                  seconds={seconds}
                  tone={preparing ? "prepare" : "active"}
                />
              )}
            </div>
            {error && (
              <div className="mt-5">
                <InlineError>{error}</InlineError>
              </div>
            )}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Đề bài
                </p>
                <WritingQuestionPrompt question={current} />
              </div>
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-stone-50/60 p-4 sm:p-5">
                <label className="text-sm font-bold" htmlFor="writing-answer">
                  Bài làm của bạn
                </label>
                <textarea
                  className="mt-2 min-h-64 w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 xl:min-h-80"
                  disabled={preparing || transitioning}
                  id="writing-answer"
                  spellCheck={false}
                  onDrop={(event) => event.preventDefault()}
                  onPaste={(event) => event.preventDefault()}
                  onChange={(event) => saveLocalAnswer(event.target.value)}
                  placeholder={
                    preparing
                      ? "Editor sẽ mở khi hết thời gian chuẩn bị."
                      : current.part === 1
                        ? "Viết một câu tiếng Anh…"
                        : current.part === 2
                          ? "Dear …"
                          : "Write your essay here…"
                  }
                  value={current.answer}
                />
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                  <span
                    aria-live="polite"
                    className={`inline-flex items-center gap-1.5 ${
                      preparing
                        ? "font-semibold text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${preparing ? "bg-amber-500" : saving ? "animate-pulse bg-orange-500" : "bg-emerald-500"}`}
                    />
                    {preparing
                      ? "Editor đang khóa trong pha chuẩn bị."
                      : saving
                        ? "Đang autosave…"
                        : hasPendingSave
                          ? "Chưa lưu trên server"
                          : "Đã autosave trên server"}
                  </span>
                  {current.part === 3 && (
                    <span
                      className={
                        words >= (current.minimumWordCount ?? 0)
                          ? "font-bold text-emerald-700"
                          : "font-semibold text-orange-700"
                      }
                    >
                      {words}/{current.minimumWordCount} từ
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
              {preparing ? (
                <p className="text-sm font-semibold text-slate-500">
                  Đọc đề và chuẩn bị ý. Editor sẽ mở khi timer về 00:00.
                </p>
              ) : (
                <button
                  className={primaryAction}
                  disabled={saving || transitioning}
                  onClick={() => (isLast ? setConfirming(true) : void next())}
                  type="button"
                >
                  {isLast ? "Nộp bài" : "Next · khóa câu này"}
                </button>
              )}
            </div>
          </section>
        }
      />
      {confirming && (
        <ConfirmDialog
          confirmLabel="Xác nhận nộp"
          id="writing-submit-dialog-title"
          onCancel={closeConfirm}
          onConfirm={() => void submit()}
          title="Nộp bài Writing?"
        >
          Câu cuối sẽ bị khóa và bài được chuyển sang trạng thái chờ chấm AI.
          Bạn không thể quay lại chỉnh sửa.
        </ConfirmDialog>
      )}
    </PracticePage>
  );
}
