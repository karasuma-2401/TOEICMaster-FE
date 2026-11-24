"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { LISTENING_LAST } from "../parts";
import {
  formatMissingList,
  formatRemainingText,
  type SubmissionSummary,
} from "../session";
import { ExamIcon, primaryButton, secondaryButton } from "./exam-ui";

export interface SubmitConfirmDialogProps {
  summary: SubmissionSummary;
  remainingSeconds: number;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SubmitConfirmDialog({
  summary,
  remainingSeconds,
  pending = false,
  onCancel,
  onConfirm,
}: SubmitConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const missingCount = summary.missing.length;
  const readingOnly = summary.missing.every(
    (number) => number > LISTENING_LAST,
  );

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onCancel();
      }}
      open
    >
      <DialogContent
        aria-describedby="submit-dialog-note"
        aria-labelledby="submit-dialog-title"
        className="flex w-[min(42.5rem,calc(100vw-2rem))] flex-col gap-6 rounded-2xl p-6 sm:p-8"
        closeLabel="Close"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
        size="lg"
      >
        <div className="flex items-start gap-4 pr-8">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--tm-brand-soft)]">
            <ExamIcon className="size-7" name="file-question" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <DialogTitle
              className="text-2xl leading-tight font-semibold text-[var(--tm-ink)]"
              id="submit-dialog-title"
            >
              Confirm Exam Submission?
            </DialogTitle>
            <p className="text-[13px] text-[var(--tm-ink-muted)]">
              You can still review any unanswered questions.
            </p>
          </div>
        </div>

        <dl className="flex flex-col gap-5 rounded-xl bg-[var(--tm-page)] p-6 text-[var(--tm-ink-soft)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <dt className="text-[15px]">Questions answered</dt>
            <dd className="text-lg font-semibold text-[var(--tm-ink)]">
              {summary.answered} / {summary.total} questions (Listening:{" "}
              {summary.listeningAnswered}/{LISTENING_LAST} · Reading:{" "}
              {summary.readingAnswered}/{summary.total - LISTENING_LAST})
            </dd>
          </div>
          <div className="flex items-start justify-between gap-2 text-[var(--tm-danger)]">
            <dt className="text-[15px]">Unanswered questions</dt>
            <dd className="rounded-lg bg-[var(--tm-danger-soft)] px-2.5 py-1 text-[11px] font-semibold">
              {missingCount} questions
            </dd>
          </div>
          {missingCount > 0 ? (
            <p className="text-[13px] text-[var(--tm-danger)]">
              Includes {missingCount}
              {readingOnly ? " Reading" : ""} questions:{" "}
              {formatMissingList(summary.missing)}
              {readingOnly ? " (Listening completed)." : "."}
            </p>
          ) : null}
          <div className="flex items-start justify-between gap-2 text-[15px]">
            <dt>Remaining time</dt>
            <dd className="font-semibold text-[var(--tm-warning)]">
              {formatRemainingText(remainingSeconds)}
            </dd>
          </div>
        </dl>

        <DialogDescription
          className="text-[13px] text-[var(--tm-ink-muted)]"
          id="submit-dialog-note"
        >
          After submitting, the system will immediately grade your exam using
          the ETS 10–990 scale. You cannot go back and edit your answers once
          confirmed.
        </DialogDescription>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            className={secondaryButton}
            disabled={pending}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            Continue Exam
          </button>
          <button
            className={primaryButton}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "Submitting…" : "Confirm L&R Submission"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
