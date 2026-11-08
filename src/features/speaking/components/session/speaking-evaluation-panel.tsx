"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSpeakingAttempt,
  getSpeakingEvaluationAvailability,
  grantSpeakingEvaluationConsent,
} from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import {
  isEvaluationPending,
  type SpeakingEvaluation,
  type SpeakingEvaluationItem,
} from "@/features/speaking/evaluation";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import {
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";

const pollMilliseconds = 5_000;

/**
 * AI evaluation of a submitted attempt: explains what is sent where, asks for
 * consent, polls while the job runs and shows the report when it completes.
 */
export function SpeakingEvaluationPanel({
  attempt,
  uploading,
}: {
  attempt: SpeakingAttempt;
  /** Recordings still uploading; evaluation must wait for them. */
  uploading: boolean;
}) {
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(
    attempt.evaluation,
  );
  const [available, setAvailable] = useState<boolean | null>(null);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRecordings = attempt.questions.some(
    (question) => question.recording,
  );

  useEffect(() => {
    const controller = new AbortController();
    getSpeakingEvaluationAvailability(controller.signal)
      .then(setAvailable)
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, []);

  const refresh = useCallback(async () => {
    try {
      setEvaluation((await getSpeakingAttempt(attempt.id)).evaluation);
    } catch {
      // A failed poll keeps the last state; the next tick tries again.
    }
  }, [attempt.id]);
  const pending = isEvaluationPending(evaluation);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => void refresh(), pollMilliseconds);
    return () => window.clearInterval(timer);
  }, [pending, refresh]);

  const requestEvaluation = async () => {
    setSubmitting(true);
    setError(null);
    try {
      setEvaluation(
        (await grantSpeakingEvaluationConsent(attempt.id)).evaluation,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể yêu cầu chấm AI lúc này.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="speaking-ai-evaluation" className="mt-8">
      <h2 className="text-lg font-bold" id="speaking-ai-evaluation">
        Chấm điểm bằng AI
      </h2>
      {error && (
        <p
          className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800 ring-1 ring-red-200"
          role="alert"
        >
          {error}
        </p>
      )}

      {!evaluation && available === null && (
        <p className="mt-3 text-sm text-slate-500">
          Đang kiểm tra dịch vụ chấm AI…
        </p>
      )}

      {!evaluation && available === false && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
          <p className="font-bold text-slate-900">
            Chấm AI cho Speaking chưa được bật trên máy chủ
          </p>
          <p className="mt-1">
            Quản trị viên cần cấu hình Azure Speech và Gemini để dùng tính năng
            này. Bạn vẫn có thể nghe lại bản ghi và tự đánh giá theo tiêu chí
            bên dưới.
          </p>
        </div>
      )}

      {!evaluation && available && (
        <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="font-bold">Gửi bài nói để AI chấm ước tính</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
            <li>
              Bản ghi được gửi đến <b>Azure Speech</b> để chuyển thành văn bản
              và chấm phát âm: độ chính xác, độ trôi chảy, ngữ điệu.
            </li>
            <li>
              Văn bản đó được gửi đến <b>Gemini</b> để chấm ngữ pháp, từ vựng và
              mức độ trả lời đúng trọng tâm.
            </li>
            <li>
              Hệ thống tổng hợp thành điểm từng câu và điểm ước tính trên thang
              0–200.
            </li>
          </ol>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Kết quả chỉ để luyện tập, không phải điểm TOEIC/ETS chính thức. Đừng
            nói thông tin cá nhân trong bản ghi.
          </p>
          {!hasRecordings ? (
            <p className="mt-4 text-sm font-semibold text-amber-800">
              Lượt này chưa có bản ghi nào nên chưa thể chấm.
            </p>
          ) : (
            <>
              <label className="mt-4 flex gap-3 rounded-xl bg-white/70 p-3 text-sm leading-6 text-slate-800 ring-1 ring-orange-100">
                <input
                  checked={consented}
                  className="mt-1 size-4 accent-orange-600"
                  onChange={(event) => setConsented(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  Tôi đồng ý gửi bản ghi và văn bản bài nói đến các dịch vụ AI
                  trên để chấm ước tính.
                </span>
              </label>
              {uploading && (
                <p className="mt-3 text-sm text-slate-600">
                  Đang chờ tải xong bản ghi lên máy chủ…
                </p>
              )}
              <button
                className={`mt-4 ${primaryAction}`}
                disabled={!consented || submitting || uploading}
                onClick={() => void requestEvaluation()}
                type="button"
              >
                {submitting ? "Đang gửi yêu cầu…" : "Đồng ý và chấm bài"}
              </button>
            </>
          )}
        </div>
      )}

      {evaluation && pending && (
        <div
          aria-live="polite"
          className="mt-3 flex gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950"
        >
          <span
            aria-hidden="true"
            className="mt-1 size-4 shrink-0 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600"
          />
          <div>
            <p className="font-bold">
              {evaluation.status === "QUEUED"
                ? "Đã xếp hàng chờ chấm"
                : "AI đang nghe và chấm bài nói"}
            </p>
            <p className="mt-1">
              Thường mất dưới một phút cho mỗi Part. Bạn có thể rời trang; kết
              quả được lưu lại và trang này tự cập nhật mỗi 5 giây.
              {evaluation.status === "RETRYING" &&
                ` Dịch vụ AI đang bận, hệ thống sẽ tự thử lại (lần ${evaluation.retryCount}).`}
            </p>
          </div>
        </div>
      )}

      {evaluation?.status === "FAILED" && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <p className="font-bold">Chưa thể chấm bài lúc này</p>
          <p className="mt-1">{evaluation.failureMessage}</p>
          <button
            className={`mt-4 ${secondaryAction} border-amber-400`}
            disabled={submitting}
            onClick={() => void requestEvaluation()}
            type="button"
          >
            {submitting ? "Đang gửi…" : "Thử chấm lại"}
          </button>
        </div>
      )}

      {evaluation?.status === "COMPLETED" && (
        <EvaluationReport evaluation={evaluation} />
      )}
    </section>
  );
}

function EvaluationReport({ evaluation }: { evaluation: SpeakingEvaluation }) {
  return (
    <div className="mt-3 space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white shadow-[0_16px_40px_-20px_rgb(234_88_12/0.8)]">
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10"
        />
        <p className="text-sm font-bold uppercase tracking-wide">
          Điểm TOEIC Speaking ước tính bởi AI
        </p>
        <p className="mt-2 text-5xl font-black">
          {evaluation.estimatedScore ?? 0}
          <span className="text-2xl">/200</span>
        </p>
        <p className="mt-3 text-sm text-orange-50">
          Phát âm: {evaluation.speechProvider} · Ngôn ngữ:{" "}
          {evaluation.languageModel}. Không phải kết quả ETS chính thức.
        </p>
      </div>
      {evaluation.summary && (
        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold">Nhận xét tổng quan</h3>
          <p className="mt-2 leading-7 text-slate-700">{evaluation.summary}</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FeedbackList
          items={evaluation.strengths}
          title="Điểm mạnh"
          tone="green"
        />
        <FeedbackList
          items={evaluation.improvements}
          title="Cần cải thiện"
          tone="amber"
        />
      </div>
      <ul className="space-y-3">
        {evaluation.items.map((item) => (
          <ItemReport item={item} key={item.position} />
        ))}
      </ul>
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
      className={`rounded-2xl p-5 ring-1 ${tone === "green" ? "bg-emerald-50 ring-emerald-100" : "bg-amber-50 ring-amber-100"}`}
    >
      <h3 className="font-bold">{title}</h3>
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

function ItemReport({ item }: { item: SpeakingEvaluationItem }) {
  const scores: [string, number | null][] = [
    ["Phát âm tổng", item.pronunciationScore],
    ["Độ chính xác", item.accuracyScore],
    ["Trôi chảy", item.fluencyScore],
    ["Ngữ điệu", item.prosodyScore],
    ["Đọc đủ đoạn", item.completenessScore],
    ["Ngữ pháp", item.grammarScore],
    ["Từ vựng", item.vocabularyScore],
    ["Đúng trọng tâm", item.relevanceScore],
  ];
  return (
    <li className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold">
          Câu {item.position} · Part {item.part} ·{" "}
          {speakingPartSpecs[item.part].subtitle}
        </p>
        <p className="rounded-full bg-orange-50 px-3 py-1 text-sm font-black text-orange-700 ring-1 ring-orange-200">
          {item.rawScore}/{item.maxRawScore} điểm
        </p>
      </div>
      {item.recognitionStatus === "RECOGNIZED" ? (
        <>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            AI nghe được
          </p>
          <p
            className="mt-1 rounded-xl bg-stone-50 p-3 leading-7 text-slate-800"
            lang="en"
          >
            {item.transcript}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {scores
              .filter(([, value]) => value !== null)
              .map(([label, value]) => (
                <div
                  className="rounded-xl bg-white p-2 ring-1 ring-slate-100"
                  key={label}
                >
                  <dt className="text-slate-500">{label}</dt>
                  <dd
                    className={`mt-0.5 text-base font-bold ${scoreTone(value!)}`}
                  >
                    {Math.round(value!)}
                  </dd>
                </div>
              ))}
          </dl>
          {item.wordIssues.length > 0 && (
            <p className="mt-3 text-sm text-slate-700">
              <b>Từ cần luyện phát âm: </b>
              <span lang="en">
                {item.wordIssues.map((issue) => issue.word).join(", ")}
              </span>
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm font-semibold text-amber-800">
          {item.recognitionStatus === "NO_RECORDING"
            ? "Câu này không có bản ghi."
            : "Không nhận diện được giọng nói trong bản ghi."}
        </p>
      )}
      <p className="mt-3 text-sm leading-6 text-slate-700">{item.feedback}</p>
      {item.suggestedResponse && (
        <p
          className="mt-2 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-950 ring-1 ring-emerald-100"
          lang="en"
        >
          <b lang="vi">Gợi ý trả lời: </b>
          {item.suggestedResponse}
        </p>
      )}
    </li>
  );
}

function scoreTone(value: number) {
  return value >= 80
    ? "text-emerald-700"
    : value >= 60
      ? "text-amber-700"
      : "text-red-700";
}
