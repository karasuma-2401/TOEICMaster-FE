import { LrResultPage } from "@/features/lr-exam/components/lr-exam-live-pages";

export default async function LrResultRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <LrResultPage attemptId={attemptId} />;
}
