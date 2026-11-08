"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  getSpeakingAttempt,
  getSpeakingEvaluationAvailability,
  grantSpeakingEvaluationConsent,
} from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import {
  isEvaluationPending,
  type SpeakingEvaluation,
} from "@/features/speaking/evaluation";
import { formatDate, formatElapsed } from "../ui/format";
import { CheckIcon, CircleIcon, ClockIcon, LoaderIcon } from "../ui/icons";
import { SpPage } from "../ui/page";
import {
  Breadcrumb,
  Chip,
  GradingStepper,
  ProgressBar,
  Waveform,
} from "../ui/primitives";
import { SpeakingResultReport } from "./speaking-result-report";

const pollMilliseconds = 5_000;

const tiles = [
  ["01", "Azure Speech", "Phân tích phát âm, ngữ điệu và trọng âm."],
  ["02", "Gemini", "Chấm ngữ pháp, từ vựng và tính liên kết."],
  [
    "03",
    "Tổng hợp điểm 0–200",
    "Ước tính theo tiêu chí ETS, với bước 10 điểm.",
  ],
];

const reviewHref = (attemptId: string) =>
  `/speaking/attempts/${encodeURIComponent(attemptId)}/review/1`;

function Heading({
  overline,
  title,
  description,
}: {
  overline: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="sp-overline text-(--sp-ink-2)">{overline}</p>
      <h2 className="mt-2 text-[24px] font-semibold leading-8 lg:text-[30px] lg:leading-10">
        {title}
      </h2>
      <p className="mt-1 text-(--sp-ink-2)">{description}</p>
    </>
  );
}

function PipelineRow({
  state,
  children,
}: {
  state: "done" | "active" | "todo";
  children: ReactNode;
}) {
  return (
    <li
      className={`flex items-center gap-3 text-sm ${state === "done" ? "text-(--sp-success)" : state === "todo" ? "text-(--sp-ink-2)" : ""}`}
    >
      {state === "done" && <CheckIcon size={20} />}
      {state === "active" && (
        <LoaderIcon className="animate-spin text-(--sp-brand)" size={20} />
      )}
      {state === "todo" && <CircleIcon size={20} />}
      {children}
    </li>
  );
}

/**
 * AI evaluation of a submitted attempt: explains what is sent where, asks for
 * consent, polls while the job runs and shows the report when it completes.
 */
export function SpeakingEvaluationPanel({
  attempt,
  uploading,
  failedUploads = [],
  onRetryUpload,
}: {
  attempt: SpeakingAttempt;
  /** Recordings still uploading; evaluation must wait for them. */
  uploading: boolean;
  failedUploads?: number[];
  onRetryUpload?: (position: number) => void;
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

  if (evaluation?.status === "COMPLETED")
    return <SpeakingResultReport attempt={attempt} evaluation={evaluation} />;

  const saved = attempt.questions.filter((item) => item.recording).length;
  const queued = evaluation?.status === "QUEUED";
  const dataNote = pending
    ? "Bạn đã đồng ý gửi dữ liệu để AI đánh giá bài nói này."
    : "Chỉ bắt đầu gửi dữ liệu khi bạn đồng ý chấm AI.";

  return (
    <SpPage narrow>
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Đề thi thử", href: "/speaking" },
          { label: "Speaking", href: "/speaking" },
          { label: "Chấm điểm bài thi" },
        ]}
      />
      <Chip className="mt-4 uppercase" tone="speak">
        SPEAKING
      </Chip>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-semibold leading-9">
          Chấm điểm bài thi Speaking
        </h1>
        <GradingStepper current={pending ? 2 : 1} />
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1.5fr_0.53fr]">
        <section
          aria-labelledby="speaking-ai-evaluation"
          className="sp-card min-w-0 p-7"
        >
          <h2 className="sr-only" id="speaking-ai-evaluation">
            Chấm điểm bằng AI
          </h2>
          {error && (
            <p
              className="mb-4 rounded-xl bg-(--sp-danger-bg) p-3 text-sm font-semibold text-(--sp-danger)"
              role="alert"
            >
              {error}
            </p>
          )}
          {failedUploads.length > 0 && (
            <div className="mb-4 rounded-xl bg-(--sp-danger-bg) p-3 text-sm text-(--sp-danger)">
              <p className="font-semibold">Một số bản ghi chưa tải lên được.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {failedUploads.map((position) => (
                  <button
                    className="sp-btn sp-btn-sm sp-btn-outline"
                    key={position}
                    onClick={() => onRetryUpload?.(position)}
                    type="button"
                  >
                    Thử tải lại câu {position}
                  </button>
                ))}
              </div>
            </div>
          )}

          {pending ? (
            <div aria-live="polite">
              <Heading
                description="Bạn không cần ghi âm lại. Vui lòng giữ trang này mở trong khi AI đánh giá."
                overline="ĐÃ NHẬN ĐỒNG Ý · ĐANG XỬ LÝ"
                title="AI đang nghe và chấm bài nói của bạn (khoảng 20–40 giây)…"
              />
              <div className="mt-5 rounded-2xl border border-(--sp-line) bg-(--sp-subtle) px-8 py-12 lg:pl-[28%]">
                <p className="sp-overline text-(--sp-ink-2)">
                  ĐANG PHÂN TÍCH BẢN GHI ÂM
                </p>
                <p className="mt-2 text-2xl font-semibold">Azure Speech</p>
                <Waveform
                  animated
                  bars={40}
                  className="my-3 text-(--sp-brand)"
                />
                <p className="text-[13px] text-(--sp-ink-2)">
                  Phân tích phát âm, ngữ điệu & trọng âm
                </p>
              </div>
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg font-semibold">
                  {queued ? "Đã xếp hàng chờ chấm" : "Đang chấm phát âm"}
                </p>
                <p className="text-xs text-(--sp-ink-2)">
                  Thời gian xử lý thường 15–45 giây
                </p>
              </div>
              <div className="mt-2">
                <ProgressBar label="Tiến độ chấm" value={queued ? 0.1 : 0.4} />
              </div>
              <ul className="mt-4 space-y-3">
                <PipelineRow state={queued ? "active" : "done"}>
                  Đã tối ưu hóa file âm thanh
                </PipelineRow>
                <PipelineRow state={queued ? "todo" : "active"}>
                  Azure Speech đang chấm phát âm…
                </PipelineRow>
                <PipelineRow state="todo">
                  Gemini chuẩn bị đánh giá ngữ pháp.
                </PipelineRow>
              </ul>
              {evaluation?.status === "RETRYING" && (
                <p className="mt-3 text-[13px] text-(--sp-warning)">
                  Dịch vụ AI đang bận, hệ thống sẽ tự thử lại (lần{" "}
                  {evaluation.retryCount}).
                </p>
              )}
              <p className="mt-4 text-xs text-(--sp-ink-2)">
                Kết quả sẽ hiển thị sau khi tất cả bước đánh giá hoàn tất.
              </p>
            </div>
          ) : (
            <>
              <Heading
                description="Nhận phân tích bài nói và gợi ý cải thiện qua 3 bước đánh giá."
                overline="BÀI NÓI ĐÃ SẴN SÀNG · XÁC NHẬN TRƯỚC KHI CHẤM"
                title="Gửi bài nói để AI đánh giá & chấm điểm ước tính theo chuẩn ETS"
              />
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {tiles.map(([number, title, description]) => (
                  <div
                    className="rounded-[14px] border border-(--sp-line) bg-(--sp-subtle) p-4"
                    key={number}
                  >
                    <p className="text-[13px] text-(--sp-brand)">{number}</p>
                    <p className="mt-1 text-lg font-semibold">{title}</p>
                    <p className="text-[13px] text-(--sp-ink-2)">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
              <hr className="my-6 border-(--sp-line)" />

              {available === null && !evaluation && (
                <p className="text-sm text-(--sp-ink-2)">
                  Đang kiểm tra dịch vụ chấm AI…
                </p>
              )}
              {available === false && !evaluation && (
                <div className="rounded-xl bg-(--sp-subtle) p-5 text-sm leading-6">
                  <p className="font-semibold">
                    Chấm AI cho Speaking chưa được bật trên máy chủ
                  </p>
                  <p className="mt-1 text-(--sp-ink-2)">
                    Quản trị viên cần cấu hình Azure Speech và Gemini để dùng
                    tính năng này. Bạn vẫn có thể nghe lại bản ghi và tự đánh
                    giá.
                  </p>
                </div>
              )}
              {evaluation?.status === "FAILED" && (
                <div className="rounded-[14px] border-[1.5px] border-(--sp-warning-line) bg-(--sp-warning-bg) p-5 text-sm">
                  <p className="font-semibold">Chưa thể chấm bài lúc này</p>
                  <p className="mt-1">{evaluation.failureMessage}</p>
                  <button
                    className="sp-btn sp-btn-solid mt-4"
                    disabled={submitting}
                    onClick={() => void requestEvaluation()}
                    type="button"
                  >
                    {submitting ? "Đang gửi…" : "Thử chấm lại"}
                  </button>
                </div>
              )}
              {available && !evaluation && !hasRecordings && (
                <p className="text-sm font-semibold text-(--sp-warning)">
                  Lượt này chưa có bản ghi nào nên chưa thể chấm.
                </p>
              )}
              {available && !evaluation && hasRecordings && (
                <>
                  <label className="flex min-h-20 items-center gap-3 rounded-xl border border-(--sp-line) p-4 text-sm">
                    <input
                      checked={consented}
                      className="size-5 shrink-0 accent-(--sp-brand)"
                      onChange={(event) => setConsented(event.target.checked)}
                      type="checkbox"
                    />
                    Tôi đồng ý gửi bản ghi âm và văn bản bài nói đến các dịch vụ
                    AI để chấm điểm ước tính.
                  </label>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-2 text-[13px] text-(--sp-ink-2)">
                      <ClockIcon size={16} />
                      {uploading
                        ? "Đang chờ tải xong bản ghi lên máy chủ…"
                        : "Thời gian xử lý thường khoảng 15–45 giây"}
                    </p>
                    <button
                      className="sp-btn sp-btn-solid"
                      disabled={!consented || submitting || uploading}
                      onClick={() => void requestEvaluation()}
                      type="button"
                    >
                      {submitting
                        ? "Đang gửi yêu cầu…"
                        : "Đồng ý & Bắt đầu chấm AI →"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        <aside className="min-w-0 space-y-4">
          <section className="sp-card p-5">
            <h2 className="text-lg font-semibold">Bài nói của bạn</h2>
            <p className="mt-3 font-semibold">{attempt.testTitle}</p>
            <p className="text-xs text-(--sp-ink-2)">
              {formatDate(attempt.createdAtUtc)}
            </p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-(--sp-ink-2)">Câu trả lời</dt>
                <dd>
                  {saved} / {attempt.questions.length} câu
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-(--sp-ink-2)">Thời gian làm bài</dt>
                <dd>
                  {formatElapsed(attempt.createdAtUtc, attempt.submittedAtUtc)}
                </dd>
              </div>
            </dl>
            <hr className="my-3 border-(--sp-line)" />
            <p className="flex items-center gap-1.5 text-[13px]">
              <CheckIcon className="text-(--sp-success)" size={15} />
              Đã hoàn thành bài ghi âm
            </p>
            <Link
              className="sp-btn sp-btn-sm sp-btn-outline mt-3 w-full"
              href={reviewHref(attempt.id)}
            >
              Nghe lại bài làm
            </Link>
          </section>
          <section className="rounded-2xl border border-(--sp-line) bg-(--sp-row-hover) p-5">
            <h2 className="font-semibold">Minh bạch về dữ liệu</h2>
            <p className="mt-2 text-[13px] text-(--sp-ink-2)">
              Bản ghi âm được gửi đến Azure Speech; văn bản bài nói được Gemini
              phân tích để tạo đánh giá và điểm ước tính.
            </p>
            <p className="mt-2 text-xs text-(--sp-ink-2)">{dataNote}</p>
          </section>
        </aside>
      </div>
      <p className="mt-8 text-center text-[13px] text-(--sp-ink-2)">
        Điểm AI chỉ mang tính tham khảo theo tiêu chí ETS, không thay thế kết
        quả thi chính thức.
      </p>
    </SpPage>
  );
}
