"use client";

import { useEffect, useState } from "react";
import {
  getLrAttempt,
  getLrListeningPlaylist,
  getLrMediaUrl,
  getLrResult,
  getLrReview,
  type LrListeningPlaylistApi,
} from "../api";
import { resultToReport, reviewToState, sheetToRoomState } from "../mappers";
import { LrExamRoom } from "./lr-exam-room";
import { LrResultReportView } from "./lr-result-report";
import { LrReview } from "./lr-review";

function LoadingOrError({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 bg-[#faf7f5] p-8 text-center text-[#4c4542]">
      <p className="text-lg font-semibold">
        {loading
          ? "Đang tải dữ liệu bài thi…"
          : "Không thể tải dữ liệu bài thi"}
      </p>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {!loading ? (
        <button
          className="rounded-lg bg-[#ea580c] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => window.location.reload()}
          type="button"
        >
          Tải lại trang
        </button>
      ) : null}
    </main>
  );
}

export function LrExamSessionPage({ attemptId }: { attemptId: string }) {
  const [state, setState] = useState<ReturnType<
    typeof sheetToRoomState
  > | null>(null);
  const [playlist, setPlaylist] = useState<LrListeningPlaylistApi | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getLrAttempt(attemptId, controller.signal)
      .then(async (sheet) => {
        const imageAssetIds = new Set<string>();
        for (const block of sheet.blocks) {
          for (const context of block.contextBlocks) {
            if (context.imageAssetId) imageAssetIds.add(context.imageAssetId);
          }
          for (const question of block.questions) {
            if (question.imageAssetId) imageAssetIds.add(question.imageAssetId);
          }
        }
        const playlistPromise =
          sheet.phase === "listening"
            ? getLrListeningPlaylist(attemptId, controller.signal).catch(
                () => undefined,
              )
            : Promise.resolve(undefined);
        const mediaEntries = await Promise.all(
          [...imageAssetIds].map(async (assetId) => {
            try {
              const media = await getLrMediaUrl(
                attemptId,
                "images",
                assetId,
                controller.signal,
              );
              return [assetId, media.url] as const;
            } catch {
              return null;
            }
          }),
        );
        const nextPlaylist = await playlistPromise;
        if (controller.signal.aborted) return;
        const mediaUrls = Object.fromEntries(
          mediaEntries.filter(
            (entry): entry is readonly [string, string] => entry !== null,
          ),
        );
        setPlaylist(nextPlaylist);
        setState(sheetToRoomState(sheet, mediaUrls));
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error ? cause.message : "Không thể tải bài thi.",
          );
        }
      });
    return () => controller.abort();
  }, [attemptId]);

  if (!state) return <LoadingOrError loading={!error} error={error} />;

  return (
    <LrExamRoom
      {...state}
      playlist={playlist}
      resultHref={`/exams/lr/attempts/${attemptId}/result`}
    />
  );
}

export function LrResultPage({ attemptId }: { attemptId: string }) {
  const [report, setReport] = useState<ReturnType<
    typeof resultToReport
  > | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getLrResult(attemptId, controller.signal)
      .then((result) => {
        setReport(resultToReport(result));
        setExamId(result.examId);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error ? cause.message : "Không thể tải kết quả.",
          );
        }
      });
    return () => controller.abort();
  }, [attemptId]);

  if (!report || !examId) {
    return <LoadingOrError loading={!error} error={error} />;
  }

  return (
    <LrResultReportView
      examHref={`/exams/lr/${examId}`}
      report={report}
      reviewHref={`/exams/lr/attempts/${attemptId}/review`}
    />
  );
}

export function LrReviewPage({ attemptId }: { attemptId: string }) {
  const [state, setState] = useState<ReturnType<typeof reviewToState> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getLrReview(attemptId, "All", controller.signal)
      .then(async (review) => {
        const assetIds = new Set<string>();
        for (const block of review.blocks) {
          for (const context of block.contextBlocks) {
            if (context.imageAssetId) assetIds.add(context.imageAssetId);
          }
          for (const question of block.questions) {
            if (question.imageAssetId) assetIds.add(question.imageAssetId);
          }
        }
        const entries = await Promise.all(
          [...assetIds].map(async (assetId) => {
            try {
              const media = await getLrMediaUrl(
                attemptId,
                "images",
                assetId,
                controller.signal,
              );
              return [assetId, media.url] as const;
            } catch {
              return null;
            }
          }),
        );
        const mediaUrls = Object.fromEntries(
          entries.filter(
            (entry): entry is readonly [string, string] => entry !== null,
          ),
        );
        setState(reviewToState(review, mediaUrls));
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải phần xem lại.",
          );
        }
      });
    return () => controller.abort();
  }, [attemptId]);

  if (!state) return <LoadingOrError loading={!error} error={error} />;

  return (
    <LrReview
      attemptId={attemptId}
      resultHref={`/exams/lr/attempts/${attemptId}/result`}
      state={state}
    />
  );
}
