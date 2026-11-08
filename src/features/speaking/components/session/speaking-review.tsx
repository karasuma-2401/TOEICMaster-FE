"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeakingAttempt, recordingUrl } from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import type { SpeakingEvaluationItem } from "@/features/speaking/evaluation";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { speakingParts } from "@/features/speaking/types";
import { PageNavButtons } from "@/shared/components/practice/page-nav-buttons";
import { SpeakingPrompt } from "../prompts/speaking-prompt";
import { formatClock, formatDate } from "../ui/format";
import { PlayIcon, SquareIcon } from "../ui/icons";
import {
  Chip,
  ProgressBar,
  SpError,
  SpLoading,
  SpeakingLogo,
  Waveform,
} from "../ui/primitives";

function RecordingPlayer({ src, label }: { src: string; label: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        aria-label={playing ? `Dừng ${label}` : `Phát ${label}`}
        className="sp-focus grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-(--sp-brand) text-(--sp-brand)"
        onClick={() =>
          playing ? audio.current?.pause() : void audio.current?.play()
        }
        type="button"
      >
        {playing ? <SquareIcon size={14} /> : <PlayIcon size={14} />}
      </button>
      <div className="min-w-0 flex-1">
        <Waveform
          bars={40}
          className="text-(--sp-brand)"
          height={36}
          progress={duration ? time / duration : 0}
        />
      </div>
      <span className="sp-mono text-xs text-(--sp-ink-2)">
        {formatClock(time)} / {formatClock(duration)}
      </span>
      {/* Learners hear their own voice; there is no transcript for it. */}
      <audio
        onDurationChange={(event) => {
          const value = event.currentTarget.duration;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        preload="metadata"
        ref={audio}
        src={src}
      >
        <track kind="captions" />
      </audio>
    </div>
  );
}

/** The transcript with mispronounced words underlined and explained on hover. */
function Transcript({ item }: { item: SpeakingEvaluationItem }) {
  const issues = new Map(
    item.wordIssues.map((issue) => [issue.word.toLowerCase(), issue]),
  );
  return (
    <p className="mt-3 leading-7" lang="en">
      {item.transcript.split(/(\s+)/).map((token, index) => {
        const issue = issues.get(
          token.toLowerCase().replace(/[^\p{L}']/gu, ""),
        );
        return issue ? (
          <span
            className="sp-word-issue"
            key={index}
            title={`${issue.word} · Độ chính xác: ${Math.round(issue.accuracyScore)}/100`}
          >
            {token}
          </span>
        ) : (
          token
        );
      })}
    </p>
  );
}

function metrics(item: SpeakingEvaluationItem) {
  const all: [string, number | null][] = [
    ["PHÁT ÂM TỔNG", item.pronunciationScore],
    ["ĐỘ CHÍNH XÁC", item.accuracyScore],
    ["ĐỘ TRÔI CHẢY", item.fluencyScore],
    ["NGỮ ĐIỆU (PROSODY)", item.prosodyScore],
    ["ĐỌC ĐỦ ĐOẠN", item.completenessScore],
    ["NGỮ PHÁP", item.grammarScore],
    ["TỪ VỰNG", item.vocabularyScore],
    ["TRỌNG TÂM", item.relevanceScore],
  ];
  return all.flatMap(([label, value]) =>
    value === null ? [] : [{ label, value: Math.round(value) }],
  );
}

/** Read-only review of one question of a submitted attempt. */
export function SpeakingReview({
  attemptId,
  position,
}: {
  attemptId: string;
  position: number;
}) {
  const [attempt, setAttempt] = useState<SpeakingAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        setAttempt(await getSpeakingAttempt(attemptId, signal));
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải lượt làm Speaking.",
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

  const base = `/speaking/attempts/${encodeURIComponent(attemptId)}`;
  const question = attempt?.questions.find(
    (item) => item.position === position,
  );
  const shell = (body: React.ReactNode) => (
    <div className="sp-page">
      <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-(--sp-line) bg-(--sp-surface) px-4 py-2 md:px-6">
        <div className="flex items-center gap-4">
          <SpeakingLogo />
          <PageNavButtons />
        </div>
        {attempt && (
          <div className="text-center">
            <p className="font-semibold">
              {attempt.testTitle} · Xem lại bài làm
            </p>
            <p className="text-xs text-(--sp-ink-2)">
              {formatDate(attempt.createdAtUtc)} · Chỉ đọc
            </p>
          </div>
        )}
        <Link className="sp-btn sp-btn-outline" href={base}>
          ← Về báo cáo kết quả
        </Link>
      </header>
      <main className="px-4 pb-12 pt-6 md:px-6">{body}</main>
    </div>
  );

  if (error)
    return shell(<SpError message={error} onRetry={() => void load()} />);
  if (!attempt) return shell(<SpLoading label="Đang tải bài làm…" />);
  if (!question)
    return shell(<SpError message="Không tìm thấy câu hỏi trong lượt làm." />);

  const { evaluation } = attempt;
  const item = evaluation?.items.find((entry) => entry.position === position);
  const notes = attempt.reviewQuestions.find(
    (entry) => entry.position === position,
  );
  const spec = speakingPartSpecs[question.part];
  const recorded = attempt.questions.filter((entry) => entry.recording).length;
  const list = item ? metrics(item) : [];

  return shell(
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Xem lại bài thi Speaking</h1>
          <p className="text-[13px] text-(--sp-ink-2)">
            {attempt.testTitle}
            {evaluation?.estimatedScore != null &&
              ` · ${evaluation.estimatedScore}/200 điểm ước tính`}
          </p>
        </div>
        <Chip tone="success">CHỈ ĐỌC · ĐÃ NỘP BÀI</Chip>
      </div>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sp-card p-5">
          <h2 className="text-lg font-semibold">Danh sách câu hỏi</h2>
          <p className="text-xs text-(--sp-ink-2)">
            {recorded}/{attempt.questions.length} câu đã thu âm
          </p>
          {speakingParts.map((part) => {
            const cells = attempt.questions.filter(
              (entry) => entry.part === part,
            );
            if (cells.length === 0) return null;
            return (
              <div className="mt-4" key={part}>
                <p className="text-xs text-(--sp-ink-2)">
                  Part {part} · {speakingPartSpecs[part].title}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {cells.map((entry) => {
                    const current = entry.position === position;
                    return (
                      <Link
                        aria-current={current ? "page" : undefined}
                        className={`sp-focus grid size-9 place-items-center rounded-md text-[13px] font-semibold ${current ? "border-2 border-(--sp-brand) bg-(--sp-surface) text-(--sp-ink)" : entry.recording ? "bg-(--sp-success-solid) text-white" : "border border-(--sp-line) bg-(--sp-subtle)"}`}
                        href={`${base}/review/${entry.position}`}
                        key={entry.position}
                      >
                        {entry.position}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className="mt-4 text-xs text-(--sp-ink-2)">
            Ô viền cam: câu đang xem
            <br />
            Chế độ xem lại · Không chỉnh sửa
          </p>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="text-lg font-semibold">
              Question {question.position} · Part {question.part}: {spec.title}
            </h2>
            <p className="text-[13px] text-(--sp-speak)">
              Chuẩn bị {question.preparationSeconds}s · Trả lời{" "}
              {question.responseSeconds}s
            </p>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <section className="sp-card p-5">
              <Chip className="mb-3" tone="speak">
                ĐỀ BÀI · QUESTION {question.position}
              </Chip>
              <SpeakingPrompt
                content={question.content}
                questionIndex={question.questionIndex}
                showDirections={false}
              />
            </section>
            <section className="sp-card p-5">
              <h3 className="font-semibold">Bài thu âm của bạn</h3>
              {question.recording ? (
                <RecordingPlayer
                  key={question.position}
                  label={`bản ghi câu ${question.position}`}
                  src={recordingUrl(attempt.id, question.position)}
                />
              ) : (
                <p className="mt-2 text-[13px] text-(--sp-ink-2)">
                  Câu này không có bản ghi.
                </p>
              )}
              <p className="mt-2 text-xs text-(--sp-ink-2)">
                Bản ghi đã nộp trong kỳ thi, không thể thu lại
              </p>
            </section>
          </div>

          {item && (
            <div className="grid items-start gap-5 xl:grid-cols-2">
              <section className="sp-card p-5">
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">Văn bản AI nghe được</h3>
                    <p className="text-xs text-(--sp-ink-2)">
                      Azure Speech-to-Text · Từ bài nói của bạn
                    </p>
                  </div>
                  <Chip tone="speak">SPEECH STT</Chip>
                </div>
                {item.recognitionStatus === "RECOGNIZED" ? (
                  <>
                    <Transcript item={item} />
                    {item.wordIssues.length > 0 && (
                      <p className="mt-3 text-xs text-(--sp-ink-2)">
                        ▬ Gạch chân đỏ cam: từ có vấn đề phát âm · Hover từ để
                        xem chi tiết
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-(--sp-warning)">
                    {item.recognitionStatus === "NO_RECORDING"
                      ? "Câu này không có bản ghi."
                      : "Không nhận diện được giọng nói trong bản ghi."}
                  </p>
                )}
              </section>
              {(item.suggestedResponse || notes?.modelAnswer) && (
                <section className="sp-card p-5">
                  <h3 className="font-semibold">Transcript mẫu đạt điểm cao</h3>
                  <p className="mt-3 leading-7" lang="en">
                    {item.suggestedResponse || notes?.modelAnswer}
                  </p>
                </section>
              )}
            </div>
          )}

          {item && list.length > 0 && (
            <section className="sp-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    Chỉ số AI · Question {question.position}
                  </h3>
                  <p className="text-xs text-(--sp-ink-2)">
                    Azure Speech + Gemini · Phân tích bài nói
                  </p>
                </div>
                <div className="rounded-xl border border-(--sp-brand) px-4 py-2 text-center">
                  <p className="sp-overline text-(--sp-brand)">ĐIỂM THÔ CÂU</p>
                  <p className="text-xl font-bold text-(--sp-brand)">
                    {item.rawScore}/{item.maxRawScore} điểm
                  </p>
                  <p className="text-[11px] text-(--sp-ink-2)">
                    Điểm thô · Khác tổng 200
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {list.map(({ label, value }) => (
                  <div
                    className="rounded-xl border border-(--sp-line) p-4"
                    key={label}
                  >
                    <p className="sp-overline text-(--sp-ink-2)">
                      <span className="text-(--sp-brand)">● </span>
                      {label}
                    </p>
                    <p className="my-1 text-[26px] font-bold text-(--sp-brand)">
                      {value}
                      <span className="text-xs font-medium">/100</span>
                    </p>
                    <ProgressBar label={label} value={value / 100} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {item?.feedback && (
              <section className="sp-card p-5">
                <h3 className="font-semibold">✓ Điểm làm tốt</h3>
                <p className="mt-2 text-[13px] text-(--sp-ink-2)">
                  {item.feedback}
                </p>
              </section>
            )}
            {notes?.rubricNotes && (
              <section className="rounded-2xl border border-(--sp-hero-line) bg-(--sp-cream) p-5">
                <h3 className="font-semibold">Cần luyện thêm</h3>
                <p className="mt-2 text-[13px] text-(--sp-ink-2)">
                  {notes.rubricNotes}
                </p>
              </section>
            )}
          </div>
          {!item && notes?.modelAnswer && (
            <section className="sp-card p-5">
              <h3 className="font-semibold">Transcript mẫu đạt điểm cao</h3>
              <p className="mt-3 leading-7" lang="en">
                {notes.modelAnswer}
              </p>
            </section>
          )}
        </div>
      </div>
    </>,
  );
}
