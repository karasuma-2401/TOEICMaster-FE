import Link from "next/link";
import { recordingUrl } from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import type { UploadState } from "@/features/speaking/hooks/use-recording-uploads";
import type { Recording } from "@/features/speaking/hooks/use-voice-recorder";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { routeFromMode } from "@/features/speaking/practice";
import { StatGrid } from "@/shared/components/practice/stat-grid";
import {
  eyebrow,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { SpeakingEvaluationPanel } from "./speaking-evaluation-panel";
import { stepSummary } from "./step-summary";

const uploadLabel: Record<UploadState, string> = {
  uploading: "Đang tải bản ghi lên…",
  uploaded: "Đã lưu trên máy chủ",
  failed: "Tải lên thất bại",
};

export function SessionReview({
  attempt,
  localRecordings,
  uploads,
  onRetry,
}: {
  attempt: SpeakingAttempt;
  localRecordings: Record<number, Recording>;
  uploads: Record<number, UploadState>;
  onRetry: (position: number) => void;
}) {
  const { questions } = attempt;
  const saved = questions.filter((question) => question.recording).length;
  const pending = Object.values(uploads).filter(
    (state) => state === "uploading",
  ).length;
  const parts = [...new Set(questions.map((question) => question.part))];
  const review = new Map(
    attempt.reviewQuestions.map((item) => [item.position, item]),
  );
  return (
    <div>
      <p className={eyebrow}>SPEAKING REVIEW</p>
      <h1 className="mt-3 text-3xl font-bold">Đã hoàn thành lượt luyện</h1>
      <p className="mt-3 max-w-prose leading-7 text-slate-600">
        Nghe lại từng câu trả lời, so sánh với tiêu chí chấm và bài mẫu, hoặc
        gửi bài nói để AI chấm điểm ước tính.
      </p>
      <div className="mt-7">
        <StatGrid
          className="sm:grid-cols-3"
          items={[
            { label: "Số câu", value: `${questions.length} câu` },
            { label: "Đã lưu bản ghi", value: `${saved}/${questions.length}` },
            {
              label: "Trạng thái",
              value: pending ? "Đang tải bản ghi" : "Đã nộp bài",
              accent: true,
            },
          ]}
        />
      </div>
      <SpeakingEvaluationPanel attempt={attempt} uploading={pending > 0} />
      <div className="mt-8 space-y-6">
        {parts.map((part) => (
          <section aria-labelledby={`review-part-${part}`} key={part}>
            <h2 className="text-lg font-bold" id={`review-part-${part}`}>
              Part {part} · {speakingPartSpecs[part].subtitle}
            </h2>
            <ul className="mt-3 space-y-3">
              {questions
                .filter((question) => question.part === part)
                .map((question) => {
                  const local = localRecordings[question.position];
                  const upload = uploads[question.position];
                  const source =
                    local?.url ??
                    (question.recording
                      ? recordingUrl(attempt.id, question.position)
                      : null);
                  const notes = review.get(question.position);
                  return (
                    <li
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                      key={question.position}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-orange-600">
                            CÂU {question.position}
                          </p>
                          <p
                            className="mt-1 max-w-prose font-semibold"
                            lang="en"
                          >
                            {stepSummary(question)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${upload === "failed" ? "bg-red-50 text-red-700 ring-red-100" : source ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-50 text-slate-500 ring-slate-200"}`}
                        >
                          {upload
                            ? uploadLabel[upload]
                            : question.recording
                              ? `Đã ghi ${question.recording.durationSeconds}s`
                              : "Không có bản ghi"}
                        </span>
                      </div>
                      {source && (
                        <audio
                          aria-label={`Bản ghi câu ${question.position}`}
                          className="mt-3 w-full"
                          controls
                          src={source}
                        >
                          {/* Learners hear their own voice; there is no transcript yet. */}
                          <track kind="captions" />
                        </audio>
                      )}
                      {upload === "failed" && (
                        <button
                          className="mt-2 text-sm font-bold text-red-700 underline underline-offset-4"
                          onClick={() => onRetry(question.position)}
                          type="button"
                        >
                          Thử tải lại bản ghi
                        </button>
                      )}
                      {notes && (notes.rubricNotes || notes.modelAnswer) && (
                        <details className="mt-3 rounded-xl bg-stone-50 px-4 py-3 text-sm">
                          <summary className="cursor-pointer font-semibold text-slate-700">
                            Gợi ý tự đánh giá
                          </summary>
                          {notes.rubricNotes && (
                            <p className="mt-2 max-w-prose leading-6 text-slate-600">
                              <b>Tiêu chí: </b>
                              {notes.rubricNotes}
                            </p>
                          )}
                          {notes.modelAnswer && (
                            <p
                              className="mt-2 max-w-prose leading-6 text-orange-900"
                              lang="en"
                            >
                              <b>Bài mẫu: </b>
                              {notes.modelAnswer}
                            </p>
                          )}
                        </details>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
        <Link className={primaryAction} href={practiceAgainHref(attempt)}>
          Luyện lại
        </Link>
        <Link
          className={secondaryAction}
          href={
            attempt.exerciseId
              ? `/speaking/parts/${attempt.questions[0]?.part ?? 1}`
              : "/speaking"
          }
        >
          {attempt.exerciseId ? "Chọn bài khác" : "Làm đề khác"}
        </Link>
      </div>
    </div>
  );
}

/** Starts the same exercise again for Part practice, otherwise the same test and mode. */
function practiceAgainHref(attempt: SpeakingAttempt) {
  if (attempt.exerciseId)
    return `/speaking/exercises/${encodeURIComponent(attempt.exerciseId)}/practice`;
  return `/speaking/tests/${encodeURIComponent(attempt.testId ?? "")}/practice?mode=${routeFromMode(attempt.mode)}`;
}
