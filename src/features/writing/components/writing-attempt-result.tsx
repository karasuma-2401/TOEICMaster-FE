"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  displayMode,
  grantWritingEvaluationConsent,
  getWritingAttempt,
  type WritingAttemptApi,
} from "@/features/writing/attempt-api";
import { PracticePage } from "@/shared/components/practice/practice-page";
import { StatGrid } from "@/shared/components/practice/stat-grid";
import {
  ErrorPanel,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  eyebrow,
  primaryAction,
  secondaryAction,
  surfaceCard,
} from "@/shared/components/practice/styles";
import { WritingEvaluationReport } from "./writing-evaluation-report";
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
    <PracticePage header={<WritingHeader />}>
      <section className={`p-7 sm:p-10 ${surfaceCard}`}>
        <p className={eyebrow}>WRITING RESULT</p>
        <h1 className="mt-3 text-3xl font-bold">
          {isComplete ? "Kết quả Writing" : "Đã nộp bài Writing"}
        </h1>
        <p className="mt-3 max-w-prose leading-7 text-slate-600">
          Bài làm đã được lưu an toàn trên server. Điểm AI là ước tính phục vụ
          luyện tập, không phải kết quả TOEIC/ETS chính thức.
        </p>
        {attempt ? (
          <div className="mt-7">
            <StatGrid
              className="sm:grid-cols-3"
              items={[
                { label: "Dạng làm", value: displayMode(attempt.mode) },
                {
                  label: "Số câu đã nộp",
                  value: `${attempt.questions.length} câu`,
                },
                {
                  label: "Trạng thái",
                  value: isComplete
                    ? "Đã có kết quả"
                    : needsConsent
                      ? "Chờ xác nhận"
                      : "Đang chấm AI",
                  accent: true,
                },
              ]}
            />
          </div>
        ) : error ? (
          <ErrorPanel
            message={error}
            onRetry={() => void load()}
            retryLabel="Thử tải lại"
          />
        ) : (
          <LoadingPanel label="Đang tải trạng thái bài làm…" />
        )}
        {attempt && needsConsent && (
          <section className="mt-7 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <h2 className="font-bold">Gửi bài để AI chấm ước tính</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Khi xác nhận, nội dung đề và bài viết của bạn sẽ được gửi đến
              Gemini để tạo điểm ước tính và phản hồi. Với Gemini Free Tier, nội
              dung có thể được dùng để cải thiện sản phẩm của nhà cung cấp.
              Không gửi thông tin cá nhân vào bài làm.
            </p>
            <label className="mt-4 flex gap-3 rounded-xl bg-white/70 p-3 text-sm leading-6 text-slate-800 ring-1 ring-orange-100">
              <input
                checked={consented}
                className="mt-1 size-4 accent-orange-600"
                onChange={(event) => setConsented(event.target.checked)}
                type="checkbox"
              />
              <span>
                Tôi đồng ý gửi bài làm đến dịch vụ AI để chấm ước tính.
              </span>
            </label>
            <button
              className={`mt-5 ${primaryAction}`}
              disabled={!consented || submittingConsent}
              onClick={() => void queueEvaluation()}
              type="button"
            >
              {submittingConsent ? "Đang gửi yêu cầu…" : "Đồng ý và chấm bài"}
            </button>
          </section>
        )}
        {attempt && shouldPoll && (
          <section className="mt-7 flex gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950">
            <span
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600"
            />
            <div>
              <h2 className="font-bold">AI đang chấm bài</h2>
              <p className="mt-1">
                Bạn có thể rời trang; kết quả sẽ được lưu lại. Trạng thái này tự
                cập nhật mỗi 5 giây.
                {evaluationStatus === "RETRYING" &&
                  " Hệ thống đang thử lại sau khi dịch vụ AI bận."}
              </p>
            </div>
          </section>
        )}
        {attempt && evaluation?.status === "FAILED" && (
          <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <h2 className="font-bold">Chưa thể chấm bài lúc này</h2>
            <p className="mt-1">{evaluation.failureMessage}</p>
            <button
              className={`mt-4 ${secondaryAction} border-amber-400`}
              disabled={submittingConsent}
              onClick={() => void queueEvaluation()}
              type="button"
            >
              {submittingConsent ? "Đang gửi…" : "Thử chấm lại"}
            </button>
          </section>
        )}
        {attempt && isComplete && evaluation && (
          <WritingEvaluationReport
            evaluation={evaluation}
            reviewQuestions={attempt.reviewQuestions}
          />
        )}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <Link className={primaryAction} href="/history/writing">
            Xem lịch sử
          </Link>
          <Link className={secondaryAction} href="/writing">
            Làm đề khác
          </Link>
        </div>
      </section>
    </PracticePage>
  );
}
