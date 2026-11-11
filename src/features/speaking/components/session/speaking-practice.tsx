"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSpeakingEvaluationAvailability,
  getSpeakingExercise,
  getSpeakingExercises,
  startSpeakingExercisePractice,
  submitSpeakingAttempt,
  type SpeakingExerciseSummary,
} from "@/features/speaking/api";
import type { SpeakingAttemptQuestion } from "@/features/speaking/attempt";
import { isGuestEvaluationLimit } from "@/features/speaking/evaluation";
import { useSpeechPlayback } from "@/features/speaking/hooks/use-speech-playback";
import { useVoiceRecorder } from "@/features/speaking/hooks/use-voice-recorder";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import {
  countWords,
  difficultyLabels,
  isFreePracticePart,
  markPauses,
  practiceIntro,
  practiceTips,
} from "@/features/speaking/practice-guide";
import { submitPracticeTake } from "@/features/speaking/practice-submission";
import { SpeakingPrompt } from "../prompts/speaking-prompt";
import { formatClock } from "../ui/format";
import {
  AlertCircleIcon,
  HeadphonesIcon,
  MicIcon,
  PlayIcon,
  SquareIcon,
} from "../ui/icons";
import { SpPage } from "../ui/page";
import {
  Breadcrumb,
  Chip,
  SpError,
  SpLoading,
  Waveform,
} from "../ui/primitives";
import { SpeakingSession } from "./speaking-session";

/** Picks the free-practice screen or the timed run from the exercise's Part. */
export function SpeakingPracticeEntry({ exerciseId }: { exerciseId: string }) {
  const [exercise, setExercise] = useState<SpeakingExerciseSummary | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        setExercise(await getSpeakingExercise(exerciseId, signal));
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải bài tập Speaking.",
          );
      }
    },
    [exerciseId],
  );
  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load]);

  if (!exercise)
    return (
      <SpPage>
        {error ? (
          <SpError message={error} onRetry={() => void load()} />
        ) : (
          <SpLoading label="Đang tải bài luyện…" />
        )}
      </SpPage>
    );
  return isFreePracticePart(exercise.part) ? (
    <SpeakingPractice exercise={exercise} />
  ) : (
    <SpeakingSession source={{ kind: "exercise", exerciseId }} />
  );
}

function TakePlayback({
  url,
  durationSeconds,
}: {
  url: string | null;
  durationSeconds: number;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-(--sp-subtle) px-3 py-2.5">
      <button
        className="sp-focus inline-flex cursor-pointer items-center gap-2 rounded-md text-sm disabled:cursor-not-allowed disabled:text-(--sp-ink-3)"
        disabled={!url}
        onClick={() =>
          playing ? audio.current?.pause() : void audio.current?.play()
        }
        type="button"
      >
        {playing ? <SquareIcon size={16} /> : <PlayIcon size={16} />}
        {playing ? "Dừng nghe lại" : "Nghe lại bản thu trước"}
      </button>
      <p className="flex gap-10 text-xs text-(--sp-ink-2)">
        <span>{formatClock(time)}</span>
        <span>{formatClock(durationSeconds)}</span>
      </p>
      {url && (
        <audio
          key={url}
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          preload="metadata"
          ref={audio}
          src={url}
        >
          <track kind="captions" />
        </audio>
      )}
    </div>
  );
}

function CompareCard({ passage }: { passage: string }) {
  const speech = useSpeechPlayback(passage);
  return (
    <section className="sp-card p-5">
      <h2 className="flex items-center gap-3 text-lg font-semibold">
        <HeadphonesIcon className="text-(--sp-brand)" size={24} />
        Đối chiếu với giọng đọc mẫu
      </h2>
      {speech.supported && (
        <button
          className="sp-btn sp-btn-cta mt-4"
          onClick={speech.toggle}
          type="button"
        >
          {speech.speaking ? <SquareIcon size={16} /> : <PlayIcon size={16} />}
          {speech.speaking ? "Dừng giọng đọc mẫu" : "Nghe giọng đọc mẫu"}
        </button>
      )}
      <p className="mt-2 text-xs text-(--sp-ink-2)">
        American English · Giọng đọc tổng hợp của trình duyệt
      </p>
      <h3 className="mt-4 font-semibold">Transcript mẫu · Ngắt nghỉ</h3>
      <div className="mt-2 space-y-2 text-sm leading-6" lang="en">
        {markPauses(passage).map((sentence, index) => (
          <p key={index}>{sentence}</p>
        ))}
      </div>
      <p className="mt-3 text-xs text-(--sp-ink-2)">
        / Nghỉ ngắn · // Nghỉ cuối câu
      </p>
    </section>
  );
}

/**
 * Free practice of a one-question exercise: the learner records as often as
 * they like in the browser and can send one take to AI grading.
 */
function SpeakingPractice({ exercise }: { exercise: SpeakingExerciseSummary }) {
  const router = useRouter();
  const recorder = useVoiceRecorder();
  const [question, setQuestion] = useState<SpeakingAttemptQuestion | null>(
    null,
  );
  const [list, setList] = useState<SpeakingExerciseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [take, setTake] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [consented, setConsented] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [guestLimited, setGuestLimited] = useState(false);
  const started = useRef(false);

  // The backend only returns an exercise's content inside an attempt. This
  // attempt is closed at once; the take is sent through a fresh one later.
  const load = useCallback(async () => {
    setError(null);
    try {
      const [attempt, exercises] = await Promise.all([
        startSpeakingExercisePractice(exercise.id),
        getSpeakingExercises(exercise.part),
      ]);
      setQuestion(attempt.questions[0] ?? null);
      setList(exercises);
      void submitSpeakingAttempt(attempt.id).catch(() => undefined);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải nội dung bài luyện.",
      );
    }
  }, [exercise.id, exercise.part]);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    window.setTimeout(() => void load(), 0);
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    getSpeakingEvaluationAvailability(controller.signal)
      .then(setAvailable)
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, []);

  const { recordingKey, requestAccess, start, stop } = recorder;
  const recording = recordingKey !== null;
  const limit = question?.responseSeconds ?? 0;
  useEffect(() => {
    if (!recording) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      setElapsed(seconds);
      if (limit > 0 && seconds >= limit) stop();
    }, 200);
    return () => window.clearInterval(timer);
  }, [limit, recording, stop]);

  const begin = async () => {
    if (!(await requestAccess())) return;
    const next = take + 1;
    setElapsed(0);
    setTake(next);
    start(next);
  };

  const latestKey = Math.max(
    0,
    ...Object.keys(recorder.recordings).map(Number),
  );
  const latest = recorder.recordings[latestKey] ?? null;

  const send = async () => {
    if (!latest) return;
    setSending(true);
    setSendError(null);
    setGuestLimited(false);
    try {
      const attemptId = await submitPracticeTake(exercise.id, latest);
      router.push(`/speaking/attempts/${encodeURIComponent(attemptId)}`);
    } catch (cause) {
      if (isGuestEvaluationLimit(cause)) setGuestLimited(true);
      else
        setSendError(
          cause instanceof Error
            ? cause.message
            : "Không thể gửi bản thu lúc này.",
        );
      setSending(false);
    }
  };

  const spec = speakingPartSpecs[exercise.part];
  const crumbs = [
    { label: "Trang chủ", href: "/" },
    { label: "Bài tập", href: "/speaking/parts/1" },
    { label: "Speaking", href: `/speaking/parts/${exercise.part}` },
    { label: `Part ${exercise.part}` },
  ];

  if (!question)
    return (
      <SpPage>
        <Breadcrumb items={crumbs} />
        <div className="mt-4">
          {error ? (
            <SpError message={error} onRetry={() => void load()} />
          ) : (
            <SpLoading label="Đang tải nội dung bài luyện…" />
          )}
        </div>
      </SpPage>
    );

  const { content } = question;
  const index = list.findIndex((item) => item.id === exercise.id);
  const next = index >= 0 ? list[index + 1] : undefined;
  const ordinal = String(Math.max(index, 0) + 1).padStart(2, "0");
  const total = String(list.length).padStart(2, "0");
  const meta =
    content.part === 1
      ? `${countWords(content.passage)} từ · ${difficultyLabels[exercise.difficulty]}`
      : difficultyLabels[exercise.difficulty];
  const micBlocked =
    recorder.status === "denied" || recorder.status === "unsupported";
  const canSend =
    Boolean(latest) &&
    consented &&
    !recording &&
    !sending &&
    available === true;

  return (
    <SpPage>
      <Breadcrumb items={crumbs} />
      <h1 className="mt-2 text-[32px] font-bold leading-10 text-(--sp-ink)">
        {spec.title}
      </h1>
      <p className="mt-1 text-(--sp-ink-2)">{practiceIntro[exercise.part]}</p>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div className="min-w-0 space-y-5">
          <section className="sp-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Chip className="uppercase" tone="orange">
                Bài {ordinal} / {total} · {exercise.topic}
              </Chip>
              <Chip tone="success">{meta}</Chip>
            </div>
            <div className="mt-4">
              {content.part === 1 ? (
                <p className="text-[20px] leading-8" lang="en">
                  {content.passage}
                </p>
              ) : (
                <SpeakingPrompt content={content} showDirections={false} />
              )}
            </div>
          </section>

          <section className="sp-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Bản thu của bạn</h2>
              {recording ? (
                <Chip tone="danger">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-(--sp-rec)"
                  />
                  Đang thu âm · {formatClock(elapsed)}
                </Chip>
              ) : (
                <Chip tone={latest ? "success" : "neutral"}>
                  {latest
                    ? `Đã thu · ${formatClock(latest.durationSeconds)}`
                    : "Chưa thu âm"}
                </Chip>
              )}
            </div>
            <div className="mt-3 flex justify-center">
              <Waveform
                bars={48}
                className="max-w-full text-(--sp-brand)"
                height={56}
                level={recording ? Math.max(recorder.level, 0.2) : undefined}
                progress={recording && limit ? elapsed / limit : latest ? 1 : 0}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  aria-label="Dừng thu âm"
                  className="sp-focus grid size-16 cursor-pointer place-items-center rounded-full bg-(--sp-rec) text-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!recording}
                  onClick={stop}
                  type="button"
                >
                  <SquareIcon fill="currentColor" size={24} />
                </button>
                <span className="font-semibold">Dừng thu âm</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-(--sp-ink-2)">
                  Trạng thái sẵn sàng:
                </span>
                <button
                  aria-label="Bắt đầu thu âm"
                  className="sp-focus grid size-14 cursor-pointer place-items-center rounded-full text-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={recording || sending}
                  onClick={() => void begin()}
                  style={{ background: "var(--sp-gradient)" }}
                  type="button"
                >
                  <MicIcon size={24} />
                </button>
                <span>Bắt đầu thu âm</span>
              </div>
            </div>
            {micBlocked && (
              <p className="mt-3 text-[13px] text-(--sp-danger)" role="alert">
                {recorder.status === "denied"
                  ? "Micro đang bị chặn. Bấm biểu tượng ổ khóa cạnh thanh URL, cho phép Microphone rồi thử lại."
                  : "Trình duyệt này không hỗ trợ ghi âm."}
              </p>
            )}

            <TakePlayback
              durationSeconds={latest?.durationSeconds ?? 0}
              url={latest?.url ?? null}
            />
            <p className="mt-3 text-xs text-(--sp-ink-2)">
              Luyện tập tự do: bạn có thể thu âm lại không giới hạn. Mỗi bản thu
              tối đa {limit} giây.
            </p>

            <div className="mt-4 rounded-2xl border border-(--sp-line) p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Chip tone="speak">Speaking</Chip>
                  <h3 className="font-semibold">Gửi bài luyện này chấm AI</h3>
                </div>
                <button
                  className="sp-btn sp-btn-cta sp-btn-locked"
                  disabled={!canSend}
                  onClick={() => void send()}
                  type="button"
                >
                  {sending
                    ? "Đang gửi bản thu…"
                    : "Gửi bài luyện này chấm AI →"}
                </button>
              </div>
              <p className="mt-3 text-sm text-(--sp-ink-2)">
                Chỉ gửi bản ghi của bài hiện tại để chấm điểm phát âm, trọng âm
                và ngữ điệu.
              </p>
              {available === false ? (
                <p className="mt-3 text-[13px] text-(--sp-ink-2)">
                  Chấm AI cho Speaking chưa được bật trên máy chủ.
                </p>
              ) : (
                <label className="mt-3 flex items-center gap-3 text-[13px] text-(--sp-ink-2)">
                  <input
                    checked={consented}
                    className="size-5 shrink-0 accent-(--sp-brand)"
                    onChange={(event) => setConsented(event.target.checked)}
                    type="checkbox"
                  />
                  Tôi đồng ý gửi giọng nói của mình đến dịch vụ chấm AI để nhận
                  phản hồi.
                </label>
              )}
              {sending && (
                <p
                  aria-live="polite"
                  className="mt-3 text-[13px] text-(--sp-ink-2)"
                >
                  Đang tải bản thu lên, thường mất khoảng 15–20 giây. Vui lòng
                  giữ trang này mở.
                </p>
              )}
              {sendError && (
                <p
                  className="mt-3 text-[13px] font-semibold text-(--sp-danger)"
                  role="alert"
                >
                  {sendError}
                </p>
              )}
              {guestLimited && (
                <div
                  className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--sp-warning-line) bg-(--sp-warning-bg) p-3 text-[13px]"
                  role="alert"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertCircleIcon
                      className="shrink-0 text-(--sp-warning)"
                      size={18}
                    />
                    Khách vãng lai chỉ được chấm 1 lượt/ngày. Đăng nhập để nhận
                    thêm lượt.
                  </p>
                  <Link
                    className="sp-btn sp-btn-sm sp-btn-solid"
                    href={`/login?next=${encodeURIComponent(`/speaking/exercises/${exercise.id}/practice`)}`}
                  >
                    Đăng nhập →
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          {content.part === 1 ? (
            <CompareCard passage={content.passage} />
          ) : (
            <section className="sp-card p-5">
              <h2 className="flex items-center gap-3 text-lg font-semibold">
                <HeadphonesIcon className="text-(--sp-brand)" size={24} />
                Câu trả lời mẫu
              </h2>
              <p className="mt-3 text-sm text-(--sp-ink-2)">
                Câu trả lời mẫu và nhận xét sẽ hiện sau khi bài luyện được chấm
                AI.
              </p>
            </section>
          )}
          <section className="rounded-2xl border border-(--sp-hero-line) bg-(--sp-cream) p-5">
            <h2 className="text-lg font-semibold">Mẹo đạt điểm tối đa</h2>
            <ol className="mt-2 space-y-1 text-sm">
              {practiceTips[exercise.part]?.map((tip, tipIndex) => (
                <li key={tip}>
                  {String(tipIndex + 1).padStart(2, "0")}&nbsp; {tip}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <div className="mt-5 flex flex-wrap justify-between gap-3">
        <Link
          className="sp-btn sp-btn-outline"
          href={`/speaking/parts/${exercise.part}`}
        >
          ← Quay lại danh sách bài tập
        </Link>
        {next && (
          <Link
            className="sp-btn sp-btn-cta"
            href={`/speaking/exercises/${encodeURIComponent(next.id)}/practice`}
          >
            Bài tiếp theo →
          </Link>
        )}
      </div>
    </SpPage>
  );
}
