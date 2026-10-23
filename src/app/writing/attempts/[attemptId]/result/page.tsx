import { WritingAttemptResult } from "@/features/writing/components/writing-attempt-result";

export default async function WritingAttemptResultRoute({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ attemptId }, { mode }] = await Promise.all([params, searchParams]);
  return <WritingAttemptResult attemptId={attemptId} mode={mode} />;
}
