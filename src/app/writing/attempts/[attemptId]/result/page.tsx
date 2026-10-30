import { WritingAttemptResult } from "@/features/writing/components/writing-attempt-result";

export default async function WritingAttemptResultRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <WritingAttemptResult attemptId={attemptId} />;
}
