"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  advanceAttempt,
  advanceExpiredAttempt,
  createMockAttempt,
  readStoredAttempt,
  remainingSeconds,
  toAttemptMode,
  updateAttemptAnswer,
  writeStoredAttempt,
  type MockWritingAttempt,
} from "@/features/writing/practice-mock";

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}
function containsKeyword(value: string, keyword: string) {
  return value
    .toLocaleLowerCase("en-US")
    .includes(keyword.toLocaleLowerCase("en-US"));
}

function QuestionPrompt({ attempt }: { attempt: MockWritingAttempt }) {
  const item = attempt.questions[attempt.currentIndex];
  if (item.question.part === 1)
    return (
      <>
        <div
          aria-label={item.question.imageAlt}
          className="grid h-56 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 via-amber-50 to-stone-100 text-center text-sm font-semibold text-orange-900"
        >
          {item.question.imageLabel}
          <span className="mt-1 block max-w-xs font-normal text-orange-700">
            {item.question.imageAlt}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${containsKeyword(item.answer, item.question.keywordOne) ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"}`}
          >
            {item.question.keywordOne}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${containsKeyword(item.answer, item.question.keywordTwo) ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"}`}
          >
            {item.question.keywordTwo}
          </span>
        </div>
      </>
    );
  if (item.question.part === 2)
    return (
      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6">
        <p>
          <b>From:</b> {item.question.sender}
        </p>
        <p>
          <b>To:</b> {item.question.recipient}
        </p>
        <p className="mt-2">
          <b>Subject:</b> {item.question.subject}
        </p>
        <p className="mt-5 whitespace-pre-line">{item.question.body}</p>
        <p className="mt-5 rounded-xl bg-orange-50 p-3 font-semibold text-orange-900">
          Yêu cầu: {item.question.directions}
        </p>
      </article>
    );
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-lg font-bold leading-7">{item.question.prompt}</h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
        {item.question.outline}
      </p>
      <p className="mt-4 text-sm font-semibold text-orange-800">
        Tối thiểu {item.question.minimumWordCount} từ
      </p>
    </article>
  );
}

export function WritingAttemptPlaceholder({
  attemptId,
  mode,
}: {
  attemptId: string;
  mode?: string;
}) {
  const selectedMode = toAttemptMode(mode);
  const [attempt, setAttempt] = useState<MockWritingAttempt | null>(null);
  const [now, setNow] = useState(0);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    const hydration = window.setTimeout(() => {
      const tick = Date.now();
      const saved = readStoredAttempt(attemptId, selectedMode);
      setNow(tick);
      setAttempt(
        advanceExpiredAttempt(
          saved ?? createMockAttempt(attemptId, selectedMode, tick),
          tick,
        ),
      );
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [attemptId, selectedMode]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      setAttempt((current) =>
        current ? advanceExpiredAttempt(current, tick) : current,
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!attempt) return;
    writeStoredAttempt(attempt);
  }, [attempt]);
  const current = attempt?.questions[attempt.currentIndex];
  const isLast = attempt
    ? attempt.currentIndex === attempt.questions.length - 1
    : false;
  const seconds = attempt ? remainingSeconds(attempt, now) : 0;
  const phaseLabel = current?.phase === "PREPARING" ? "Chuẩn bị" : "Làm bài";
  const advance = () =>
    setAttempt((currentAttempt) =>
      currentAttempt ? advanceAttempt(currentAttempt) : currentAttempt,
    );
  const resultHref = attempt
    ? `/writing/attempts/${encodeURIComponent(attempt.id)}/result?mode=${attempt.mode}`
    : "/history/writing";
  if (!attempt || !current)
    return (
      <main className="grid min-h-dvh place-items-center bg-stone-50 p-6">
        <p className="rounded-xl bg-white p-5 font-semibold shadow-sm">
          Đang khôi phục lượt làm bài…
        </p>
      </main>
    );
  if (attempt.status === "SUBMITTED")
    return (
      <main className="grid min-h-dvh place-items-center bg-stone-50 p-6">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
            WRITING SUBMITTED
          </p>
          <h1 className="mt-3 text-2xl font-bold">Bài làm đã được nộp</h1>
          <p className="mt-3 leading-7 text-slate-600">
            AI sẽ được tích hợp ở checkpoint sau. Hiện tại bài được lưu mock
            trên trình duyệt với trạng thái chờ chấm AI.
          </p>
          <Link
            className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white"
            href={resultHref}
          >
            Xem trạng thái bài làm
          </Link>
        </section>
      </main>
    );
  const words = current.question.part === 3 ? wordCount(current.answer) : 0;
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
              WRITING WORKSPACE · MOCK
            </p>
            <h1 className="mt-1 text-base font-bold sm:text-lg">
              {attempt.title}
            </h1>
          </div>
          <div
            className={`rounded-xl px-4 py-2 text-right ${current.phase === "PREPARING" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}
          >
            <p className="text-xs font-bold uppercase tracking-wide">
              {phaseLabel}
            </p>
            <p className="font-mono text-2xl font-bold">{clock(seconds)}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-7 lg:grid-cols-[1fr_16rem]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-orange-600">
                PART {current.question.part} · CÂU {attempt.currentIndex + 1}/
                {attempt.questions.length}
              </p>
              <h2 className="mt-2 text-xl font-bold">
                {current.question.part === 1
                  ? "Write a sentence based on a picture"
                  : current.question.part === 2
                    ? "Respond to a written request"
                    : "Write an opinion essay"}
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Tự lưu khi thay đổi
            </span>
          </div>
          <div className="mt-6">
            <QuestionPrompt attempt={attempt} />
          </div>
          <div className="mt-6">
            <label className="block text-sm font-bold" htmlFor="writing-answer">
              Bài làm của bạn
            </label>
            <textarea
              aria-describedby="editor-state"
              className="mt-2 min-h-44 w-full rounded-2xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={current.phase === "PREPARING"}
              id="writing-answer"
              onChange={(event) =>
                setAttempt((currentAttempt) =>
                  currentAttempt
                    ? updateAttemptAnswer(currentAttempt, event.target.value)
                    : currentAttempt,
                )
              }
              placeholder={
                current.phase === "PREPARING"
                  ? "Editor sẽ mở khi hết thời gian chuẩn bị."
                  : current.question.part === 1
                    ? "Viết một câu tiếng Anh…"
                    : current.question.part === 2
                      ? "Dear …"
                      : "Write your essay here…"
              }
              value={current.answer}
            />
            <div
              className="mt-2 flex flex-wrap justify-between gap-2 text-xs"
              id="editor-state"
            >
              <span
                className={
                  current.phase === "PREPARING"
                    ? "font-semibold text-amber-700"
                    : "text-emerald-700"
                }
              >
                {current.phase === "PREPARING"
                  ? "Editor đang khóa trong pha chuẩn bị."
                  : "Đã autosave trên trình duyệt"}
              </span>
              {current.question.part === 3 && (
                <span
                  className={
                    words >= current.question.minimumWordCount
                      ? "font-bold text-emerald-700"
                      : "font-semibold text-orange-700"
                  }
                >
                  {words}/{current.question.minimumWordCount} từ
                </span>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            {current.phase === "PREPARING" ? (
              <p className="text-sm font-semibold text-slate-500">
                Đọc đề và chuẩn bị ý. Bạn có thể nhập bài khi timer về 00:00.
              </p>
            ) : (
              <button
                className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white"
                onClick={() => (isLast ? setConfirming(true) : advance())}
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
            {attempt.questions.map((item, index) => (
              <span
                aria-current={
                  index === attempt.currentIndex ? "step" : undefined
                }
                className={`grid aspect-square place-items-center rounded-lg text-xs font-bold ${index === attempt.currentIndex ? "bg-orange-500 text-white" : item.phase === "LOCKED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                key={item.question.id}
              >
                {index + 1}
              </span>
            ))}
          </div>
        </aside>
      </main>
      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <dialog
            aria-label="Xác nhận nộp bài"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            open
          >
            <h2 className="text-xl font-bold">Nộp bài Writing?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Câu cuối sẽ bị khóa và bài được chuyển sang trạng thái chờ chấm
              AI. Bạn không thể quay lại chỉnh sửa.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
                onClick={() => setConfirming(false)}
                type="button"
              >
                Quay lại
              </button>
              <button
                className="rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2 text-sm font-bold text-white"
                onClick={advance}
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
