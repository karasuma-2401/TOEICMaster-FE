"use client";

import { useEffect, useRef } from "react";
import { LISTENING_LAST } from "../parts";
import {
  formatMissingList,
  formatRemainingText,
  type SubmissionSummary,
} from "../session";
import { ExamIcon, focusRing, primaryButton, secondaryButton } from "./exam-ui";

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

  useEffect(() => {
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Đóng hộp thoại"
        className="absolute inset-0 cursor-default bg-[#1f1d1c]/90"
        onClick={onCancel}
        tabIndex={-1}
        type="button"
      />
      <dialog
        open
        aria-describedby="submit-dialog-note"
        aria-labelledby="submit-dialog-title"
        aria-modal="true"
        className="relative flex max-h-full w-full max-w-[680px] flex-col gap-6 overflow-y-auto rounded-2xl bg-white p-8 shadow-[0_24px_64px_rgba(48,44,42,0.2)]"
      >
        <div className="flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#fff7ed]">
            <ExamIcon className="size-7" name="file-question" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h2
              className="text-2xl leading-tight font-semibold text-[#4c4542]"
              id="submit-dialog-title"
            >
              Xác nhận nộp bài thi?
            </h2>
            <p className="text-[13px] text-[#77716e]">
              Bạn có thể kiểm tra lại các câu còn bỏ sót.
            </p>
          </div>
          <button
            aria-label="Đóng"
            className={`rounded-md p-0.5 ${focusRing}`}
            onClick={onCancel}
            type="button"
          >
            <ExamIcon color="#77716e" name="close" />
          </button>
        </div>

        <dl className="flex flex-col gap-5 rounded-xl bg-[#faf7f5] p-6 text-[#4c4542]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <dt className="text-[15px]">Số câu đã hoàn thành</dt>
            <dd className="text-lg font-semibold">
              {summary.answered} / {summary.total} câu (Listening:{" "}
              {summary.listeningAnswered}/{LISTENING_LAST} · Reading:{" "}
              {summary.readingAnswered}/{summary.total - LISTENING_LAST})
            </dd>
          </div>
          <div className="flex items-start justify-between gap-2 text-[#dc2626]">
            <dt className="text-[15px]">Số câu chưa chọn đáp án</dt>
            <dd className="rounded-lg bg-[#fee2e2] px-2.5 py-1 text-[11px] font-semibold">
              {missingCount} câu
            </dd>
          </div>
          {missingCount > 0 ? (
            <p className="text-[13px] text-[#dc2626]">
              Bao gồm {missingCount} câu
              {readingOnly ? " phần Reading" : ""}:{" "}
              {formatMissingList(summary.missing)}
              {readingOnly ? " (Listening đã hoàn tất)." : "."}
            </p>
          ) : null}
          <div className="flex items-start justify-between gap-2 text-[15px]">
            <dt>Thời gian làm bài còn lại</dt>
            <dd className="font-semibold text-[#d97706]">
              {formatRemainingText(remainingSeconds)}
            </dd>
          </div>
        </dl>

        <p className="text-[13px] text-[#77716e]" id="submit-dialog-note">
          Sau khi nộp bài, hệ thống chấm điểm xác thực ngay lập tức theo Barem
          ETS 10–990. Bạn không thể quay lại chỉnh sửa bài làm sau khi xác nhận.
        </p>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            className={secondaryButton}
            disabled={pending}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            Tiếp tục làm bài
          </button>
          <button
            className={primaryButton}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "Đang nộp bài…" : "Xác nhận nộp bài L&R"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
