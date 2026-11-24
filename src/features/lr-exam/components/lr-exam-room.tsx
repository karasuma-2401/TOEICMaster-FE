"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/shared/components/ui/dialog";
import { formatClock } from "@/shared/ui/format-time";
import {
  abandonLrAttempt,
  saveLrAnswers,
  startLrReading,
  submitLrAttempt,
  type LrListeningPlaylistApi,
} from "../api";
import {
  useSequentialListeningPlayer,
  type ListeningTrack,
} from "../hooks/use-sequential-listening-player";
import { findGroup, formatCountdown, summarizeSubmission } from "../session";
import { sectionForQuestion } from "../parts";
import type {
  LrAnswers,
  LrChoiceKey,
  LrExamSummary,
  LrFlags,
  LrQuestion,
  LrQuestionGroup,
} from "../types";
import {
  ExamBrand,
  ExamIcon,
  PassageCard,
  Pill,
  focusRing,
  primaryButton,
  secondaryButton,
} from "./exam-ui";
import { QuestionPalette } from "./question-palette";
import { SubmitConfirmDialog } from "./submit-confirm-dialog";

export interface LrExamRoomProps {
  exam: LrExamSummary;
  groups: LrQuestionGroup[];
  initialNumber: number;
  initialAnswers: LrAnswers;
  initialFlags: LrFlags;
  initialRemainingSeconds: number;
  resultHref: string;
  attemptId?: string;
  phase?: "listening" | "reading";
  questionIds?: Record<number, string>;
  playlist?: LrListeningPlaylistApi;
}

function useCountdown(initialSeconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const expiredFiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !expiredFiredRef.current) {
      expiredFiredRef.current = true;
      onExpireRef.current();
    }
  }, [remaining]);

  return remaining;
}

export function LrExamRoom({
  exam,
  groups,
  initialNumber,
  initialAnswers,
  initialFlags,
  initialRemainingSeconds,
  resultHref,
  attemptId,
  phase: initialPhase = "listening",
  questionIds,
  playlist,
}: LrExamRoomProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(initialNumber);
  const [answers, setAnswers] = useState<LrAnswers>(initialAnswers);
  const [flags, setFlags] = useState<LrFlags>(initialFlags);
  const [confirming, setConfirming] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [abandonPending, setAbandonPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"listening" | "reading">(initialPhase);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const firstSave = useRef(true);

  const listeningTracks = useMemo<ListeningTrack[]>(() => {
    if (!playlist?.items.length) return [];
    const groupById = new Map(groups.map((item) => [item.id, item]));
    return [...playlist.items]
      .sort(
        (a, b) =>
          a.part - b.part || a.firstQuestionNumber - b.firstQuestionNumber,
      )
      .map((item) => {
        const matchedGroup = groupById.get(item.blockId);
        return {
          blockId: item.blockId,
          part: item.part,
          first: matchedGroup?.first ?? item.firstQuestionNumber,
          last: matchedGroup?.last ?? item.firstQuestionNumber,
          audioAssetId: item.audioAssetId,
          url: item.url,
          durationMs: item.durationMs ?? 0,
        };
      });
  }, [groups, playlist]);

  const listeningPlayer = useSequentialListeningPlayer({
    attemptId,
    tracks: listeningTracks,
    enabled: phase === "listening" && listeningTracks.length > 0,
  });

  const saveSnapshot = useCallback(
    async (nextAnswers: LrAnswers, nextFlags: LrFlags) => {
      if (!attemptId || !questionIds) return;
      const payload = Object.entries(questionIds)
        .filter(([number]) => phase !== "reading" || Number(number) > 100)
        .map(([number, questionId]) => ({
          questionId,
          selectedKey: nextAnswers[Number(number)] ?? null,
          isFlagged: Boolean(nextFlags[Number(number)]),
        }));
      await saveLrAnswers(attemptId, payload);
    },
    [attemptId, questionIds, phase],
  );

  useEffect(() => {
    if (!attemptId || !questionIds) return;
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      setSaveStatus("saving");
      void saveSnapshot(answers, flags)
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("error"));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [answers, flags, attemptId, questionIds, saveSnapshot]);

  const submit = useCallback(
    async (skipFinalSave = false) => {
      if (submitting) return;
      setSubmitting(true);
      setActionError(null);
      try {
        if (attemptId) {
          if (!skipFinalSave) await saveSnapshot(answers, flags);
          await submitLrAttempt(attemptId);
          router.push("/exams/lr/attempts/" + attemptId + "/result");
        } else {
          router.push(resultHref);
        }
      } catch (cause) {
        setActionError(
          cause instanceof Error ? cause.message : "Unable to submit exam.",
        );
        setSubmitting(false);
      }
    },
    [submitting, attemptId, saveSnapshot, answers, flags, router, resultHref],
  );

  const abandon = useCallback(async () => {
    if (!attemptId || abandonPending) return;
    setAbandonPending(true);
    setActionError(null);
    try {
      await abandonLrAttempt(attemptId);
      setAbandoning(false);
      router.push("/listening-reading");
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Unable to abandon exam.",
      );
      setAbandonPending(false);
      setAbandoning(false);
    }
  }, [attemptId, abandonPending, router]);

  const moveToReading = useCallback(async () => {
    if (!attemptId || phase === "reading") return;
    setActionError(null);
    try {
      await saveSnapshot(answers, flags);
      await startLrReading(attemptId);
      setPhase("reading");
      setCurrent(101);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Unable to switch to Reading.",
      );
    }
  }, [attemptId, phase, saveSnapshot, answers, flags]);

  const remaining = useCountdown(
    initialRemainingSeconds,
    () => void submit(true),
  );

  const section = phase;
  const group = findGroup(groups, current);
  const sectionGroups = useMemo(
    () => groups.filter((item) => sectionForQuestion(item.first) === section),
    [groups, section],
  );
  const selectable = useMemo(
    () =>
      new Set(
        sectionGroups.flatMap((item) =>
          item.questions.map((question) => question.number),
        ),
      ),
    [sectionGroups],
  );
  const orderedNumbers = useMemo(
    () => [...selectable].sort((a, b) => a - b),
    [selectable],
  );
  const groupIndex = group ? sectionGroups.indexOf(group) : -1;
  const nextGroup = groupIndex >= 0 ? sectionGroups[groupIndex + 1] : undefined;
  const currentNumbers = useMemo(
    () =>
      group
        ? Array.from(
            { length: group.last - group.first + 1 },
            (_, index) => group.first + index,
          )
        : [current],
    [group, current],
  );

  const choose = (number: number, key: LrChoiceKey) =>
    setAnswers((value) => ({ ...value, [number]: key }));

  const toggleFlags = (numbers: readonly number[]) =>
    setFlags((value) => {
      const next = { ...value };
      const allFlagged = numbers.every((number) => value[number]);
      for (const number of numbers) {
        if (allFlagged) delete next[number];
        else next[number] = true;
      }
      return next;
    });

  const neighbor = (direction: -1 | 1) => {
    const index = orderedNumbers.indexOf(current);
    return orderedNumbers[index + direction];
  };

  const palette = (
    <QuestionPalette
      answers={answers}
      currentNumbers={currentNumbers}
      flags={flags}
      isSelectable={(number) => selectable.has(number)}
      onSelect={setCurrent}
      section={section}
    />
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[var(--tm-page)] text-[var(--tm-ink-soft)]">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--tm-border)] bg-[var(--tm-surface)] px-4 py-3 sm:gap-x-6 sm:px-8 sm:py-2">
        <ExamBrand />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-[15px] font-semibold text-[var(--tm-ink)]">
            {exam.identity}
          </p>
          <p className="text-[11px] text-[var(--tm-ink-muted)]">
            ETS Standard Exam Room · Stable Connection
          </p>
        </div>
        <span className="rounded-md border border-[#bfdbfe] bg-[var(--tm-info-soft)] px-3 py-1.5 text-xs font-bold text-[var(--tm-info)]">
          {section === "listening"
            ? "SECTION 1 · LISTENING"
            : "SECTION 2 · READING"}
        </span>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          <div
            aria-label="Remaining time"
            className="flex items-center gap-2.5 rounded-xl bg-[var(--tm-brand-soft)] px-4 py-2 sm:gap-3 sm:px-5 sm:py-2.5"
            role="timer"
          >
            <ExamIcon name="timer" />
            <span
              className={`font-mono text-lg font-bold sm:text-xl ${section === "listening" ? "text-[var(--tm-warning)]" : "text-[var(--tm-ink)]"}`}
            >
              {formatCountdown(remaining)}
            </span>
          </div>
          {attemptId && section === "listening" ? (
            <button
              className={`${secondaryButton} whitespace-nowrap`}
              onClick={() => void moveToReading()}
              type="button"
            >
              Move to Reading →
            </button>
          ) : null}
          {attemptId ? (
            <button
              className={`${secondaryButton} whitespace-nowrap`}
              onClick={() => setAbandoning(true)}
              type="button"
            >
              Abandon
            </button>
          ) : null}
          <button
            className={`${primaryButton} whitespace-nowrap`}
            onClick={() => setConfirming(true)}
            type="button"
          >
            {section === "listening" ? "Submit Exam" : "Submit"}
          </button>
          <span
            className="text-[10px] text-[var(--tm-ink-muted)]"
            aria-live="polite"
          >
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                  ? "Save failed"
                  : ""}
          </span>
        </div>
      </header>

      {actionError ? (
        <div
          className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--tm-danger)]/35 bg-[var(--tm-danger-soft)] p-3 text-sm text-[var(--tm-danger)]"
          role="alert"
        >
          <p>{actionError}</p>
          {remaining === 0 ? (
            <button
              className={`${primaryButton} h-9 px-4 text-xs`}
              disabled={submitting}
              onClick={() => void submit(true)}
              type="button"
            >
              {submitting ? "Submitting…" : "Retry Submit"}
            </button>
          ) : null}
        </div>
      ) : null}

      {section === "listening" ? (
        <div className="flex flex-1 flex-col bg-[#f8fafc] lg:flex-row">
          <main
            className="flex min-w-0 flex-1 flex-col gap-5 px-4 py-6 sm:px-9"
            id="main-content"
            tabIndex={-1}
          >
            {phase === "listening" && listeningTracks.length > 0 ? (
              <ListeningMasterPlayer player={listeningPlayer} />
            ) : null}
            {group ? (
              <ListeningGroup
                answers={answers}
                flags={flags}
                group={group}
                nextGroup={nextGroup}
                onChoose={choose}
                onNextGroup={() => nextGroup && setCurrent(nextGroup.first)}
                onToggleFlag={() => toggleFlags(currentNumbers)}
              />
            ) : (
              <EmptyQuestion number={current} />
            )}
          </main>
          {palette}
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_320px]">
          <main
            className="flex min-w-0 flex-col gap-5"
            id="main-content"
            tabIndex={-1}
          >
            {group ? (
              <ReadingContext group={group} />
            ) : (
              <EmptyQuestion number={current} />
            )}
          </main>
          <div className="flex min-w-0 flex-col gap-4">
            {group?.questions.some((item) => item.number === current) ? (
              <ReadingQuestion
                flagged={Boolean(flags[current])}
                next={neighbor(1)}
                onChoose={(key) => choose(current, key)}
                onNavigate={setCurrent}
                onToggleFlag={() => toggleFlags([current])}
                previous={neighbor(-1)}
                question={
                  group.questions.find(
                    (item) => item.number === current,
                  ) as LrQuestion
                }
                selected={answers[current]}
              />
            ) : null}
          </div>
          <div className="min-w-0">{palette}</div>
        </div>
      )}

      {confirming ? (
        <SubmitConfirmDialog
          onCancel={() => setConfirming(false)}
          onConfirm={() => void submit()}
          pending={submitting}
          remainingSeconds={remaining}
          summary={summarizeSubmission(answers, exam.totalQuestions)}
        />
      ) : null}

      <ConfirmDialog
        cancelLabel="Continue Exam"
        confirmLabel={abandonPending ? "Abandoning…" : "Abandon Exam"}
        destructive
        id="abandon-lr-exam-title"
        onCancel={() => {
          if (!abandonPending) setAbandoning(false);
        }}
        onConfirm={() => void abandon()}
        open={abandoning}
        title="Abandon this exam attempt?"
      >
        <p>
          Your current attempt will be marked as abandoned and will not be
          graded. You can start a new attempt from the exam list anytime.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function EmptyQuestion({ number }: { number: number }) {
  return (
    <output className="block rounded-xl border border-dashed border-[var(--tm-border-strong)] bg-[var(--tm-surface)] p-6 text-[13px] text-[var(--tm-ink-muted)]">
      No content available for question {number}.
    </output>
  );
}

function Choice({
  name,
  choice,
  selected,
  onChoose,
  tone,
}: {
  name: string;
  choice: { key: LrChoiceKey; text: string };
  selected: boolean;
  onChoose: () => void;
  tone: "compact" | "roomy";
}) {
  const compact = tone === "compact";
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 border transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--tm-ring)] ${
        compact
          ? `rounded-md px-3 py-2 text-[12.5px] ${selected ? "border-[var(--tm-brand)] bg-[var(--tm-brand-soft)] font-semibold text-[var(--tm-ink)]" : "border-[#e6e9ee] bg-[var(--tm-surface)] hover:bg-[#f8fafc]"}`
          : `gap-3 rounded-[10px] p-3 text-[13px] ${selected ? "border-2 border-[var(--tm-brand)] bg-[var(--tm-brand-soft)] text-[var(--tm-ink)]" : "border-[var(--tm-border-strong)] bg-[var(--tm-surface)] hover:bg-[var(--tm-page)]"}`
      }`}
    >
      <input
        checked={selected}
        className="sr-only"
        name={name}
        onChange={onChoose}
        type="radio"
        value={choice.key}
      />
      <span
        aria-hidden="true"
        className={
          compact
            ? `text-xs ${selected ? "font-bold text-[var(--tm-brand)]" : "text-[var(--tm-ink-muted)]"}`
            : `font-semibold whitespace-nowrap ${selected ? "text-[var(--tm-brand)]" : "text-[var(--tm-ink-muted)]"}`
        }
      >
        {compact
          ? selected
            ? "●"
            : "○"
          : `${selected ? "●" : "○"} ${choice.key}.`}
      </span>
      <span className="min-w-0 break-words">
        {compact ? `${choice.key}. ` : ""}
        {choice.text}
      </span>
    </label>
  );
}

function ListeningMasterPlayer({
  player,
}: {
  player: ReturnType<typeof useSequentialListeningPlayer>;
}) {
  const {
    audioRef,
    activeTrack,
    isPlaying,
    isBuffering,
    error,
    globalElapsedMs,
    totalDurationMs,
    togglePlay,
    onLoadedMetadata,
    onTimeUpdate,
    onEnded,
  } = player;
  const progressPercent =
    totalDurationMs > 0
      ? Math.min(100, Math.max(0, (globalElapsedMs / totalDurationMs) * 100))
      : 0;
  const trackLabel = activeTrack
    ? `Part ${activeTrack.part} · Question ${activeTrack.first}${activeTrack.last > activeTrack.first ? `–${activeTrack.last}` : ""}`
    : "Listening";

  return (
    <section
      aria-label="Listening audio player"
      className="flex flex-col gap-3 rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] px-5 py-4"
      data-testid="lr-master-audio-player"
    >
      <audio
        onEnded={onEnded}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        preload="auto"
        ref={audioRef}
      >
        <track kind="captions" />
      </audio>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--tm-brand)]">
            {trackLabel}
          </p>
          <p
            className="text-xs font-semibold tabular-nums text-[var(--tm-ink-soft)]"
            data-testid="lr-master-audio-time"
          >
            {formatClock(globalElapsedMs / 1000)} /{" "}
            {formatClock(totalDurationMs / 1000)}
          </p>
        </div>
        <button
          className={`${primaryButton} min-h-[44px] shrink-0 disabled:cursor-not-allowed disabled:opacity-60`}
          data-testid="lr-master-audio-toggle"
          disabled={isPlaying && !error}
          onClick={() => void togglePlay()}
          type="button"
        >
          {isPlaying ? "Playing · Pause Locked" : "Start Listening Audio"}
        </button>
      </div>
      <div
        aria-hidden="true"
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--tm-border)]"
      >
        <div
          className="h-full rounded-full bg-[var(--tm-brand)] transition-[width] duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-[var(--tm-ink-muted)]">
        {isPlaying
          ? "Listening audio plays once per ETS rules: pausing and seeking are disabled."
          : "Listening audio plays only once per ETS rules: once started, you cannot pause or seek."}
      </p>
      {isBuffering ? (
        <output className="block text-xs text-[var(--tm-ink-muted)]">
          Buffering next audio track…
        </output>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function ListeningGroup({
  group,
  answers,
  flags,
  nextGroup,
  onChoose,
  onNextGroup,
  onToggleFlag,
}: {
  group: LrQuestionGroup;
  answers: LrAnswers;
  flags: LrFlags;
  nextGroup?: LrQuestionGroup;
  onChoose: (number: number, key: LrChoiceKey) => void;
  onNextGroup: () => void;
  onToggleFlag: () => void;
}) {
  const flagged = group.questions.every((item) => flags[item.number]);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-sm font-bold text-[var(--tm-ink)]">
          {group.heading}
        </h1>
        {group.description ? (
          <p className="text-xs text-[var(--tm-ink-muted)]">
            {group.description}
          </p>
        ) : null}
      </div>

      {group.questions.map((question) => (
        <fieldset
          className="flex flex-col gap-2.5 rounded-[10px] border border-[var(--tm-border)] bg-[var(--tm-surface)] px-5 py-4"
          key={question.number}
        >
          {question.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Presigned MinIO/S3 exam media has dynamic origins and unknown intrinsic dimensions.
            <img
              alt={`Illustration for question ${question.number}`}
              className="mb-3 max-h-72 w-auto max-w-full rounded-lg object-contain"
              src={question.imageUrl}
            />
          ) : null}
          <legend className="float-left mb-2.5 flex w-full gap-2 text-[13px]">
            <span className="font-bold text-[var(--tm-brand)]">
              QUESTION {question.number}:
            </span>
            <span className="font-semibold text-[var(--tm-ink)]">
              {question.prompt}
            </span>
          </legend>
          {question.choices.map((choice) => (
            <Choice
              choice={choice}
              key={choice.key}
              name={`question-${question.number}`}
              onChoose={() => onChoose(question.number, choice.key)}
              selected={answers[question.number] === choice.key}
              tone="compact"
            />
          ))}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          aria-pressed={flagged}
          className={`rounded-md border border-[var(--tm-warning)] px-3.5 py-2 text-[11.5px] font-medium text-[var(--tm-warning)] ${flagged ? "bg-[var(--tm-warning-soft)]" : "bg-[var(--tm-surface)]"} ${focusRing}`}
          onClick={onToggleFlag}
          type="button"
        >
          Flag for review (Group {group.first}–{group.last})
        </button>

        {nextGroup ? (
          <button
            className={`rounded-md bg-[var(--tm-brand)] px-4 py-2 text-[11.5px] font-semibold text-white hover:bg-[var(--tm-brand-hover)] ${focusRing}`}
            onClick={onNextGroup}
            type="button"
          >
            Next group ({nextGroup.first}–{nextGroup.last}) →
          </button>
        ) : null}
      </div>
    </>
  );
}

function ReadingContext({ group }: { group: LrQuestionGroup }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-sm font-bold text-[var(--tm-ink)]">
          <Pill>READING · PART {group.part}</Pill>
        </h1>
        <p className="text-[13px] text-[var(--tm-ink-muted)]">
          Questions {group.first}–{group.last}
          {group.description ? ` · ${group.description}` : ""}
        </p>
      </div>
      <section className="flex flex-col gap-3 rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface-muted)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill>🔒 Master Audio · Completed</Pill>
          <p className="text-[11px] text-[var(--tm-ink-muted)]">
            No seeking • No pausing
          </p>
        </div>
        <p className="text-[13px] text-[var(--tm-ink-soft)]">
          🔒 Listening locked
        </p>
      </section>
      {group.passage ? <PassageCard passage={group.passage} /> : null}
      <p className="text-[11px] text-[var(--tm-ink-muted)]">
        🔒 Listening section has ended. You cannot return to edit questions
        1–100.
      </p>
    </>
  );
}

function ReadingQuestion({
  question,
  selected,
  flagged,
  previous,
  next,
  onChoose,
  onToggleFlag,
  onNavigate,
}: {
  question: LrQuestion;
  selected?: LrChoiceKey;
  flagged: boolean;
  previous?: number;
  next?: number;
  onChoose: (key: LrChoiceKey) => void;
  onToggleFlag: () => void;
  onNavigate: (number: number) => void;
}) {
  return (
    <section
      aria-label={`Question ${question.number}`}
      className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl bg-[var(--tm-surface)] p-4 sm:p-5"
    >
      <Pill>QUESTION {question.number}</Pill>
      {question.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Presigned MinIO/S3 exam media has dynamic origins and unknown intrinsic dimensions.
        <img
          alt={`Illustration for question ${question.number}`}
          className="max-h-80 w-auto max-w-full self-start rounded-lg object-contain"
          src={question.imageUrl}
        />
      ) : null}
      <h2 className="text-lg font-semibold text-[var(--tm-ink)]">
        {question.prompt}
      </h2>
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">
          Choices for question {question.number}
        </legend>
        {question.choices.map((choice) => (
          <Choice
            choice={choice}
            key={choice.key}
            name={`question-${question.number}`}
            onChoose={() => onChoose(choice.key)}
            selected={selected === choice.key}
            tone="roomy"
          />
        ))}
      </fieldset>
      <button
        aria-pressed={flagged}
        className={`w-fit rounded-lg border border-[var(--tm-warning)]/40 px-3 py-1.5 text-[11px] font-semibold text-[var(--tm-warning)] ${flagged ? "bg-[#fde68a]" : "bg-[var(--tm-warning-soft)]"} ${focusRing}`}
        onClick={onToggleFlag}
        type="button"
      >
        ⚑ Flag for review
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className={secondaryButton}
          disabled={previous === undefined}
          onClick={() => previous !== undefined && onNavigate(previous)}
          type="button"
        >
          ← Previous
        </button>
        <button
          className={primaryButton}
          disabled={next === undefined}
          onClick={() => next !== undefined && onNavigate(next)}
          type="button"
        >
          Next →
        </button>
      </div>
      <output className="block text-[11px] text-[var(--tm-ink-muted)]">
        Select an answer to auto-save.
      </output>
    </section>
  );
}
