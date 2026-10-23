"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  displayMode,
  grantWritingEvaluationConsent,
  getWritingAttempt,
  type WritingAttemptApi,
} from "@/features/writing/attempt-api";
import { WritingHeader } from "./writing-header";

export function WritingAttemptResult({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<WritingAttemptApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [submittingConsent, setSubmittingConsent] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setAttempt(await getWritingAttempt(attemptId, signal));
        setError(null);
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải trạng thái bài làm.",
          );
      }
    },
    [attemptId],
  );
  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load]);
  const evaluationStatus = attempt?.evaluation?.status;
  const shouldPoll =
    evaluationStatus === "QUEUED" ||
    evaluationStatus === "PROCESSING" ||
    evaluationStatus === "RETRYING";
  useEffect(() => {
    if (!shouldPoll) return;
    const timer = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(timer);
  }, [load, shouldPoll]);
  const queueEvaluation = async () => {
    setSubmittingConsent(true);
    try {
      setAttempt(await grantWritingEvaluationConsent(attemptId));
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể yêu cầu chấm AI lúc này.",
      );
    } finally {
      setSubmittingConsent(false);
    }
  };
  const evaluation = attempt?.evaluation;
  const needsConsent = !evaluation || evaluation.status === "CONSENT_REQUIRED";
  const isComplete = evaluation?.status === "COMPLETED";
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
            WRITING RESULT
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            {isComplete ? "Kết quả Writing" : "Đã nộp bài Writing"}
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Bài làm đã được lưu an toàn trên server. Điểm AI là ước tính phục vụ
            luyện tập, không phải kết quả TOEIC/ETS chính thức.
          </p>
          {attempt ? (
            <dl className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-stone-50 p-4">
                <dt className="text-xs text-slate-500">Dạng làm</dt>
                <dd className="mt-1 font-bold">{displayMode(attempt.mode)}</dd>
              </div>
              <div className="rounded-xl bg-stone-50 p-4">
                <dt className="text-xs text-slate-500">Số câu đã nộp</dt>
                <dd className="mt-1 font-bold">
                  {attempt.questions.length} câu
                </dd>
              </div>
              <div className="rounded-xl bg-stone-50 p-4">
                <dt className="text-xs text-slate-500">Trạng thái</dt>
                <dd className="mt-1 font-bold text-orange-700">
                  {isComplete
                    ? "Đã có kết quả"
                    : needsConsent
                      ? "Chờ xác nhận"
                      : "Đang chấm AI"}
                </dd>
              </div>
            </dl>
          ) : error ? (
            <div
              aria-live="assertive"
              className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              <p>{error}</p>
              <button
                className="mt-3 font-bold underline"
                onClick={() => void load()}
                type="button"
              >
                Thử tải lại
              </button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              Đang tải trạng thái bài làm…
            </p>
          )}
          {attempt && needsConsent && (
            <section className="mt-7 rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <h2 className="font-bold">Gửi bài để AI chấm ước tính</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Khi xác nhận, nội dung đề và bài viết của bạn sẽ được gửi đến
                Gemini để tạo điểm ước tính và phản hồi. Với Gemini Free Tier,
                nội dung có thể được dùng để cải thiện sản phẩm của nhà cung
                cấp. Không gửi thông tin cá nhân vào bài làm.
              </p>
              <label className="mt-4 flex gap-3 text-sm leading-6 text-slate-800">
                <input
                  checked={consented}
                  className="mt-1 size-4"
                  onChange={(event) => setConsented(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  Tôi đồng ý gửi bài làm đến dịch vụ AI để chấm ước tính.
                </span>
              </label>
              <button
                className="mt-5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!consented || submittingConsent}
                onClick={() => void queueEvaluation()}
                type="button"
              >
                {submittingConsent ? "Đang gửi yêu cầu…" : "Đồng ý và chấm bài"}
              </button>
            </section>
          )}
          {attempt && shouldPoll && (
            <section className="mt-7 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950">
              <h2 className="font-bold">AI đang chấm bài</h2>
              <p className="mt-1">
                Bạn có thể rời trang; kết quả sẽ được lưu lại. Trạng thái này tự
                cập nhật mỗi 5 giây.
                {evaluationStatus === "RETRYING" &&
                  " Hệ thống đang thử lại sau khi dịch vụ AI bận."}
              </p>
            </section>
          )}
          {attempt && evaluation?.status === "FAILED" && (
            <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <h2 className="font-bold">Chưa thể chấm bài lúc này</h2>
              <p className="mt-1">{evaluation.failureMessage}</p>
              <button
                className="mt-4 rounded-xl border border-amber-400 px-4 py-2 font-bold"
                disabled={submittingConsent}
                onClick={() => void queueEvaluation()}
                type="button"
              >
                {submittingConsent ? "Đang gửi…" : "Thử chấm lại"}
              </button>
            </section>
          )}
          {attempt && isComplete && evaluation && (
            <section className="mt-7 space-y-5">
              <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white">
                <p className="text-sm font-bold uppercase tracking-wide">
                  Điểm TOEIC Writing ước tính bởi AI
                </p>
                <p className="mt-2 text-5xl font-black">
                  {evaluation.estimatedScore}
                  <span className="text-2xl">/200</span>
                </p>
                <p className="mt-3 text-sm text-orange-50">
                  Không phải kết quả ETS chính thức.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5">
                <h2 className="font-bold">Nhận xét tổng quan</h2>
                <p className="mt-2 leading-7 text-slate-700">
                  {evaluation.summary}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FeedbackList
                  title="Điểm làm tốt"
                  items={evaluation.strengths}
                  tone="green"
                />
                <FeedbackList
                  title="Cần cải thiện"
                  items={evaluation.improvements}
                  tone="amber"
                />
              </div>
              {evaluation.feedback.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h2 className="font-bold">Gợi ý theo câu</h2>
                  <div className="mt-4 space-y-4">
                    {evaluation.feedback.map((item) => (
                      <article
                        className="rounded-xl bg-stone-50 p-4"
                        key={item.questionPosition}
                      >
                        <h3 className="font-bold">
                          Câu {item.questionPosition}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Điểm tiêu chí AI: {item.criterionScore}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {item.feedback}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-orange-800">
                          <span className="font-bold">Gợi ý ngắn: </span>
                          {item.suggestedRevision}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {attempt.reviewQuestions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h2 className="font-bold">Bài mẫu tham khảo</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Đây là một cách triển khai tham khảo, không phải đáp án duy
                    nhất.
                  </p>
                  <div className="mt-4 space-y-4">
                    {attempt.reviewQuestions.map((question) => (
                      <article
                        className="rounded-xl bg-stone-50 p-4"
                        key={question.position}
                      >
                        <h3 className="font-bold">Câu {question.position}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {question.modelAnswer}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white"
              href="/history/writing"
            >
              Xem lịch sử
            </Link>
            <Link
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold"
              href="/writing"
            >
              Làm đề khác
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "amber";
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${tone === "green" ? "bg-emerald-50" : "bg-amber-50"}`}
    >
      <h2 className="font-bold">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
        {items.length > 0 ? (
          items.map((item) => <li key={item}>{item}</li>)
        ) : (
          <li>Chưa có nhận xét.</li>
        )}
      </ul>
    </div>
  );
}
