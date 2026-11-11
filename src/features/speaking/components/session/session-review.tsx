import type { SpeakingAttempt } from "@/features/speaking/attempt";
import type { UploadState } from "@/features/speaking/hooks/use-recording-uploads";
import { SpeakingEvaluationPanel } from "./speaking-evaluation-panel";

/** A submitted attempt: upload recovery plus the grading flow and report. */
export function SessionReview({
  attempt,
  uploads,
  onRetry,
}: {
  attempt: SpeakingAttempt;
  uploads: Record<number, UploadState>;
  onRetry: (position: number) => void;
}) {
  const states = Object.entries(uploads);
  const pending = states.some(([, state]) => state === "uploading");
  const failed = states
    .filter(([, state]) => state === "failed")
    .map(([position]) => Number(position));
  return (
    <SpeakingEvaluationPanel
      attempt={attempt}
      failedUploads={failed}
      onRetryUpload={onRetry}
      uploading={pending}
    />
  );
}
