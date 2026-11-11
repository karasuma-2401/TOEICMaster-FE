import { LrReview } from "@/features/lr-exam/components/lr-review";
import { loadReview } from "@/features/lr-exam/loaders";

export default async function LrReviewRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return (
    <LrReview
      resultHref={`/exams/lr/attempts/${attemptId}/result`}
      state={loadReview(attemptId)}
    />
  );
}
