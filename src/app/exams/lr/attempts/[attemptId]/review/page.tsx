import { LrReviewPage } from "@/features/lr-exam/components/lr-exam-live-pages";

export default async function LrReviewRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <LrReviewPage attemptId={attemptId} />;
}
