import { WritingAttemptReview } from "@/features/writing/components/writing-attempt-review";

export default async function WritingAttemptReviewRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <WritingAttemptReview attemptId={attemptId} />;
}
