import { WritingAttemptPlaceholder } from "@/features/writing/components/writing-attempt-placeholder";

export default async function WritingAttemptRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  return <WritingAttemptPlaceholder attemptId={attemptId} />;
}
