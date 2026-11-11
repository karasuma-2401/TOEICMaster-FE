import { SpeakingReview } from "@/features/speaking/components/session/speaking-review";

export default async function SpeakingReviewRoute({
  params,
}: {
  params: Promise<{ attemptId: string; q: string }>;
}) {
  const { attemptId, q } = await params;
  return <SpeakingReview attemptId={attemptId} position={Number(q)} />;
}
