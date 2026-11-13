"use client";

import { useEffect, useState } from "react";
import {
  getLrAttempt,
  getLrMediaUrl,
  getLrResult,
  getLrReview,
} from "../api";
import {
  resultToReport,
  reviewToState,
  sheetToRoomState,
} from "../mappers";
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
  const [masterAudioUrl, setMasterAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getLrAttempt(attemptId, controller.signal)
      .then(async (sheet) => {\n        const assetIds = new Set<string>();\n        for (const block of sheet.blocks) {\n          if (block.audioAssetId) assetIds.add(block.audioAssetId);\n          for (const context of block.contextBlocks) {\n            if (context.imageAssetId) assetIds.add(context.imageAssetId);\n          }\n          for (const question of block.questions) {\n            if (question.imageAssetId) assetIds.add(question.imageAssetId);\n          }\n        }\n        const mediaEntries = await Promise.all(\n          [...assetIds].map(async (assetId) => {\n            const kind = sheet.blocks.some((block) => block.audioAssetId === assetId)\n              ? "audio" as const\n              : "images" as const;\n            try {\n              const media = await getLrMediaUrl(attemptId, kind, assetId, controller.signal);\n              return [assetId, media.url] as const;\n            } catch {\n              return null;\n            }\n          }),\n        );\n        const mediaUrls = Object.fromEntries(\n          mediaEntries.filter((entry): entry is readonly [string, string] => entry !== null),\n        );\n        if (sheet.masterAudioObjectKey) {\n          try {\n            const media = await getLrMediaUrl(attemptId, "audio", undefined, controller.signal);\n            setMasterAudioUrl(media.url);\n          } catch {\n            setMasterAudioUrl(null);\n          }\n        }\n        setState(sheetToRoomState(sheet, mediaUrls));\n      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải bài thi.",
          );
        }
      });
    return () => controller.abort();
  }, [attemptId]);

  if (!state) return <LoadingOrError loading={!error} error={error} />;

  return (
    <LrExamRoom
      {...state}
      masterAudioUrl={masterAudioUrl ?? undefined}
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
            cause instanceof Error
              ? cause.message
              : "Không thể tải kết quả.",
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
  const [state, setState] = useState<ReturnType<
    typeof reviewToState
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getLrReview(attemptId, "All", controller.signal)
      .then((review) => setState(reviewToState(review)))
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
      resultHref={`/exams/lr/attempts/${attemptId}/result`}
      state={state}
    />
  );
}
