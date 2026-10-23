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
  type WritingAttemptQuestionApi,
} from "@/features/writing/attempt-api";
import { WritingHeader } from "./writing-header";

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function containsKeyword(value: string, keyword: string | null) {
  if (!keyword) return false;
  return value
    .toLocaleLowerCase("en-US")
    .includes(keyword.toLocaleLowerCase("en-US"));
}

function QuestionPrompt({ question }: { question: WritingAttemptQuestionApi }) {
  if (question.part === 1)
    return (
      <>
        {question.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote media is proxied through the application.
          <img
            alt={question.imageAlt ?? "Ảnh đề bài"}
            className="h-56 w-full rounded-2xl object-cover"
            src={question.imageUrl.replace(
              /^\/api\/v1\/writing/,
              "/api/writing",
            )}
          />
        ) : (
          <div
            aria-label={question.imageAlt ?? "Ảnh đề bài"}
            className="grid h-56 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 via-amber-50 to-stone-100 p-6 text-center text-sm font-semibold text-orange-900"
          >
            <div>
              <span className="block text-xs font-bold tracking-[0.12em] text-orange-600">
                HÌNH ẢNH ĐỀ BÀI
              </span>
              <span className="mt-2 block">
                {question.imageAlt ?? "Ảnh minh họa Part 1"}
              </span>
            </div>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {[question.keywordOne, question.keywordTwo]
            .filter((keyword): keyword is string => Boolean(keyword))
            .map((keyword) => (
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${containsKeyword(question.answer, keyword) ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"}`}
                key={keyword}
              >
                {keyword}
              </span>
            ))}
        </div>
      </>
    );
  if (question.part === 2)
    return (
      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6">
        <p>
          <b>From:</b> {question.sender}
        </p>
        <p>
          <b>To:</b> {question.recipient}
        </p>
        <p className="mt-2">
          <b>Subject:</b> {question.subject}
        </p>
        <p className="mt-5 whitespace-pre-line">{question.emailBody}</p>
        <p className="mt-5 rounded-xl bg-orange-50 p-3 font-semibold text-orange-900">
          Yêu cầu: {question.directions}
        </p>
      </article>
    );
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-lg font-bold leading-7">{question.prompt}</h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
        {question.outline}
      </p>
      <p className="mt-4 text-sm font-semibold text-orange-800">
        Tối thiểu {question.minimumWordCount} từ
      </p>
    </article>
  );
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
  const [confirming, setConfirming] = useState(false);
  const refreshInFlight = useRef(false);
  const autosaveTimer = useRef<number | null>(null);
  const pendingAutosave = useRef<{ position: number; answer: string } | null>(
    null,
  );
  const cancelSubmitButton = useRef<HTMLButtonElement>(null);

  const acceptAttempt = useCallback(
    (value: WritingAttemptApi) => {
      setServerOffset(Date.parse(value.serverNowUtc) - Date.now());
      setNow(Date.now());
      setAttempt(value);
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
    try {
      acceptAttempt(await getWritingAttempt(attemptId));
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
  useEffect(() => {
    if (!confirming) return;
    const focusCancel = window.setTimeout(
      () => cancelSubmitButton.current?.focus(),
      0,
    );
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirming(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusCancel);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [confirming]);

  const persistAnswer = useCallback(
    async (position: number, answer: string) => {
      setSaving(true);
      try {
        acceptAttempt(await saveWritingAnswer(attemptId, position, answer));
        if (
          pendingAutosave.current?.position === position &&
          pendingAutosave.current.answer === answer
        )
          pendingAutosave.current = null;
        setError(null);
        return true;
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể autosave bài viết.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [acceptAttempt, attemptId],
  );
  if (!attempt)
    return (
      <div className="min-h-dvh bg-stone-50">
        <WritingHeader />
        <p className="mx-auto max-w-5xl px-5 py-10 text-sm text-slate-500">
          Đang tải lượt làm Writing…
        </p>
        {error && (
          <div
            aria-live="assertive"
            className="mx-auto max-w-5xl px-5 text-sm text-red-700"
            role="alert"
          >
            <p>{error}</p>
            <button
              className="mt-3 font-bold underline"
              onClick={() => void refresh()}
              type="button"
            >
              Thử tải lại
            </button>
          </div>
        )}
      </div>
    );

  const current =
    attempt.currentQuestionPosition === null
      ? null
      : (attempt.questions.find(
          (question) => question.position === attempt.currentQuestionPosition,
        ) ?? null);
  if (!current)
    return (
      <div className="min-h-dvh bg-stone-50">
        <WritingHeader />
        <main className="mx-auto max-w-4xl px-5 py-10">
          <p className="rounded-xl bg-red-50 p-5 text-red-800">
            Không tìm thấy câu đang làm.
          </p>
          <Link
            className="mt-5 inline-block font-bold text-orange-700 underline"
            href="/history/writing"
          >
            Xem lịch sử
          </Link>
        </main>
      </div>
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
    autosaveTimer.current = window.setTimeout(() => {
      void persistAnswer(current.position, answer);
    }, 800);
  };
  const next = async () => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    if (!(await persistAnswer(current.position, current.answer))) return;
    setSaving(true);
    try {
      acceptAttempt(await nextWritingQuestion(attemptId));
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể chuyển câu tiếp theo.",
      );
      await refresh();
    } finally {
      setSaving(false);
    }
  };
  const submit = async () => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    if (!preparing && !(await persistAnswer(current.position, current.answer)))
      return;
    setSaving(true);
    try {
      acceptAttempt(await submitWritingAttempt(attemptId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể nộp bài.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_17rem]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
                {attempt.testCode} · CÂU {current.position}/
                {attempt.questions.length}
              </p>
              <h1 className="mt-2 text-xl font-bold">{attempt.testTitle}</h1>
            </div>
            <div
              aria-label={`${preparing ? "Chuẩn bị" : "Làm bài"}, còn ${clock(seconds)}`}
              className={`rounded-xl px-4 py-2 text-right ${preparing ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}
              role="timer"
            >
              <p className="text-xs font-bold uppercase tracking-wide">
                {preparing ? "Chuẩn bị" : "Làm bài"}
              </p>
              <p className="text-2xl font-black tabular-nums">
                {clock(seconds)}
              </p>
            </div>
          </div>
          {error && (
            <p
              aria-live="assertive"
              className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="mt-6">
            <QuestionPrompt question={current} />
          </div>
          <div className="mt-6">
            <label className="text-sm font-bold" htmlFor="writing-answer">
              Bài làm của bạn
            </label>
            <textarea
              className="mt-2 min-h-44 w-full rounded-2xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={preparing || saving}
              id="writing-answer"
              spellCheck={false}
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
                className={
                  preparing
                    ? "font-semibold text-amber-700"
                    : "text-emerald-700"
                }
              >
                {preparing
                  ? "Editor đang khóa trong pha chuẩn bị."
                  : saving
                    ? "Đang autosave…"
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
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            {preparing ? (
              <p className="text-sm font-semibold text-slate-500">
                Đọc đề và chuẩn bị ý. Editor sẽ mở khi timer về 00:00.
              </p>
            ) : (
              <button
                className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                disabled={saving}
                onClick={() => (isLast ? setConfirming(true) : void next())}
                type="button"
              >
                {isLast ? "Nộp bài" : "Next · khóa câu này"}
              </button>
            )}
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Tiến độ</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Câu đã khóa không thể mở lại.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {attempt.questions.map((question) => (
              <span
                aria-current={
                  question.position === current.position ? "step" : undefined
                }
                className={`grid aspect-square place-items-center rounded-lg text-xs font-bold ${question.position === current.position ? "bg-orange-500 text-white" : question.lockedAtUtc ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                key={question.position}
              >
                {question.position}
              </span>
            ))}
          </div>
        </aside>
      </main>
      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <dialog
            aria-modal="true"
            aria-labelledby="writing-submit-dialog-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            open
          >
            <h2 className="text-xl font-bold" id="writing-submit-dialog-title">
              Nộp bài Writing?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Câu cuối sẽ bị khóa và bài được chuyển sang trạng thái chờ chấm
              AI. Bạn không thể quay lại chỉnh sửa.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
                onClick={() => setConfirming(false)}
                ref={cancelSubmitButton}
                type="button"
              >
                Quay lại
              </button>
              <button
                className="rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2 text-sm font-bold text-white"
                onClick={() => void submit()}
                type="button"
              >
                Xác nhận nộp
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}
