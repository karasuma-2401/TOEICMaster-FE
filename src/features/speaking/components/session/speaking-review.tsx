"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeakingAttempt, recordingUrl } from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import type { SpeakingEvaluationItem } from "@/features/speaking/evaluation";
import { useAttemptHistory } from "@/features/speaking/hooks/use-attempt-history";
import { useSpeechPlayback } from "@/features/speaking/hooks/use-speech-playback";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { speakingParts, type SpeakingPart } from "@/features/speaking/types";
import { PracticePage } from "@/shared/components/practice/practice-page";
import { SpeakingPrompt } from "../prompts/speaking-prompt";
import { SpeakingHeader } from "../speaking-header";
import { formatAttemptNumber, formatClock, formatDate } from "../ui/format";
import { InfoIcon, PlayIcon, SquareIcon } from "../ui/icons";
import {
  Chip,
  ProgressBar,
  SpError,
  SpLoading,
  Waveform,
} from "../ui/primitives";

const shortPartNames: Record<SpeakingPart, string> = {
  1: "Read Aloud",
  2: "Describe Picture",
  3: "Respond Questions",
  4: "Respond Using Information",
  5: "Express Opinion",
};

const playbackRates = [1, 1.25, 1.5, 0.75];

function RecordingPlayer({ src, label }: { src: string; label: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const changeRate = () => {
    const next =
      playbackRates[(playbackRates.indexOf(rate) + 1) % playbackRates.length];
    if (audio.current) audio.current.playbackRate = next;
    setRate(next);
  };
  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        aria-label={playing ? `Dừng ${label}` : `Phát ${label}`}
        className="sp-focus grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-(--sp-surface) text-(--sp-brand)"
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
          className="text-(--sp-ink-3)"
          height={36}
          progress={duration ? time / duration : 1}
        />
      </div>
      <span className="sp-mono text-xs text-(--sp-ink-2)">
        {formatClock(time)} / {formatClock(duration)}
      </span>
      <button
        aria-label="Đổi tốc độ phát"
        className="sp-focus cursor-pointer rounded text-xs text-(--sp-ink-2)"
        onClick={changeRate}
        type="button"
      >
        {rate}×
      </button>
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

/** A model answer read by the browser voice, to compare with the recording. */
function SampleCard({ text }: { text: string }) {
  const speech = useSpeechPlayback(text);
  return (
    <section className="rounded-2xl bg-(--sp-review-sample-bg) p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Audio mẫu</h3>
        <p className="sp-overline text-(--sp-speak)">Giọng đọc mẫu</p>
      </div>
      {speech.supported ? (
        <div className="mt-3 flex items-center gap-3">
          <button
            aria-label={speech.speaking ? "Dừng audio mẫu" : "Phát audio mẫu"}
            className="sp-focus grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-(--sp-surface) text-(--sp-speak)"
            onClick={speech.toggle}
            type="button"
          >
            {speech.speaking ? (
              <SquareIcon size={14} />
            ) : (
              <PlayIcon size={14} />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <Waveform
              animated={speech.speaking}
              bars={40}
              className="text-(--sp-brand)"
              height={36}
              progress={0.6}
            />
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-(--sp-ink-2)">
          Trình duyệt này không hỗ trợ đọc văn bản.
        </p>
      )}
      <p className="mt-2 text-xs text-(--sp-ink-2)">
        {speech.speaking ? "Đang phát" : "Chưa phát"} · Giọng đọc tổng hợp của
        trình duyệt, chỉ để đối chiếu
      </p>
    </section>
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
          <button
            className="sp-word-issue sp-word-tip sp-focus"
            data-tip={`${issue.word} · Độ chính xác: ${Math.round(issue.accuracyScore)}/100`}
            key={index}
            type="button"
          >
            {token}
          </button>
        ) : (
          token
        );
      })}
    </p>
  );
}

function metrics(item: SpeakingEvaluationItem) {
  const all: [string, string, number | null][] = [
    ["PHÁT ÂM TỔNG", "Phát âm", item.pronunciationScore],
    ["ĐỘ CHÍNH XÁC", "Độ chính xác", item.accuracyScore],
    ["ĐỘ TRÔI CHẢY", "Độ trôi chảy", item.fluencyScore],
    ["NGỮ ĐIỆU (PROSODY)", "Ngữ điệu", item.prosodyScore],
    ["ĐỌC ĐỦ ĐOẠN", "Đọc đủ đoạn", item.completenessScore],
    ["NGỮ PHÁP", "Ngữ pháp", item.grammarScore],
    ["TỪ VỰNG", "Từ vựng", item.vocabularyScore],
    ["TRỌNG TÂM", "Trọng tâm", item.relevanceScore],
  ];
  return all.flatMap(([label, name, value]) =>
    value === null ? [] : [{ label, name, value: Math.round(value) }],
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
  const { items: history, number: attemptNumber } = useAttemptHistory(attempt);
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
    <PracticePage className="pb-12 pt-6" header={<SpeakingHeader />}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {attempt && (
          <div>
            <p className="font-semibold">
              {attempt.testTitle} · Xem lại bài làm
            </p>
            <p className="text-xs text-(--sp-ink-2)">
              {formatDate(attempt.createdAtUtc)} · Chỉ đọc
            </p>
          </div>
        )}
        <Link className="sp-btn sp-btn-outline ml-auto" href={base}>
          ← Về báo cáo kết quả
        </Link>
      </div>
      {body}
    </PracticePage>
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
  const weakest = list.toSorted((a, b) => a.value - b.value)[0];
  const sample = item?.suggestedResponse || notes?.modelAnswer || "";
  const attemptLabel =
    attemptNumber === null
      ? null
      : `Lần thi ${formatAttemptNumber(attemptNumber)}`;

  return shell(
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Xem lại bài thi Speaking</h1>
          <p className="text-[13px] text-(--sp-ink-2)">
            {attempt.testTitle}
            {evaluation?.estimatedScore != null &&
              ` · ${evaluation.estimatedScore}/200 điểm ước tính`}
            {attemptLabel && ` · ${attemptLabel}`}
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
                  Part {part} · {shortPartNames[part]}
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
          {history.length > 0 && (
            <>
              <h3 className="mt-5 font-semibold">Lịch sử lần thi</h3>
              <ul className="mt-2 space-y-0.5 text-xs text-(--sp-ink-2)">
                {history
                  .map((entry, index) => ({ entry, order: index + 1 }))
                  .toReversed()
                  .map(({ entry, order }) => (
                    <li key={entry.id}>
                      {formatAttemptNumber(order)} ·{" "}
                      {formatDate(entry.createdAtUtc)}
                      {entry.estimatedScore !== null &&
                        ` · ${entry.estimatedScore}/200`}
                    </li>
                  ))}
              </ul>
              {attemptNumber !== null && (
                <p className="mt-3 text-xs text-(--sp-ink-2)">
                  Đang xem dữ liệu của lần thi{" "}
                  {formatAttemptNumber(attemptNumber)}.
                </p>
              )}
            </>
          )}
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="text-lg font-semibold">
              Question {question.position} · Part {question.part}: {spec.title}
            </h2>
            <Chip tone="speak">
              Chuẩn bị {question.preparationSeconds}s · Trả lời{" "}
              {question.responseSeconds}s
            </Chip>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-[2fr_3fr]">
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
            <div className="min-w-0 space-y-4">
              <section className="rounded-2xl bg-(--sp-subtle) p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">Bài thu âm của bạn</h3>
                  {attemptLabel && (
                    <p className="sp-overline text-(--sp-ink-2)">
                      {attemptLabel}
                    </p>
                  )}
                </div>
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
              {sample && (
                <>
                  <SampleCard text={sample} />
                  <p className="text-xs text-(--sp-ink-2)">
                    Hai bản âm thanh độc lập · Chọn phát từng bản để nghe đối
                    chiếu.
                  </p>
                </>
              )}
            </div>
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
                      <p className="mt-3 flex items-center gap-2 text-xs text-(--sp-ink-2)">
                        <span
                          aria-hidden="true"
                          className="h-0.5 w-4 rounded bg-(--sp-brand)"
                        />
                        Gạch chân đỏ cam: từ có vấn đề phát âm · Hover từ để xem
                        chi tiết
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
                    {sample}
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
                  <p className="text-[28px] font-bold leading-9 text-(--sp-brand)">
                    {item.rawScore} / {item.maxRawScore}
                  </p>
                  <p className="text-[11px] text-(--sp-ink-2)">
                    Điểm thô · Khác tổng 200
                  </p>
                </div>
              </div>
              <div className="mt-4 grid overflow-hidden rounded-xl border border-(--sp-line) sm:grid-cols-2 xl:grid-cols-4">
                {list.map(({ label, value }) => (
                  <div
                    className="-mb-px -mr-px border-b border-r border-(--sp-line) p-4"
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
              <p className="mt-3 flex items-start gap-2 text-xs text-(--sp-ink-2)">
                <InfoIcon className="shrink-0 text-(--sp-lr)" size={16} />
                Điểm thô câu {item.rawScore}/{item.maxRawScore} khác với tổng
                điểm 200. Azure Speech: phát âm, độ chính xác, trôi chảy, ngữ
                điệu, đọc đủ đoạn. Gemini: ngữ pháp, từ vựng, trọng tâm.
              </p>
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
                <h3 className="font-semibold">
                  Cần luyện thêm{weakest && ` · ${weakest.name}`}
                </h3>
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
