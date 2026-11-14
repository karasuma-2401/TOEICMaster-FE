import { LrExamSessionPage } from "@/features/lr-exam/components/lr-exam-live-pages";

export default async function LrExamAttemptRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <LrExamSessionPage attemptId={attemptId} />;
}
