import { WritingAttemptPlaceholder } from "@/features/writing/components/writing-attempt-placeholder";

export default async function WritingAttemptRoute({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ attemptId }, { mode }] = await Promise.all([params, searchParams]);

  return <WritingAttemptPlaceholder attemptId={attemptId} mode={mode} />;
}
