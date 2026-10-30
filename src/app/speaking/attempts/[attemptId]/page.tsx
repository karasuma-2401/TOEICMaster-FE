import { SpeakingAttemptRun } from "@/features/speaking/components/session/speaking-attempt";

export default async function SpeakingAttemptRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <SpeakingAttemptRun attemptId={attemptId} />;
}
