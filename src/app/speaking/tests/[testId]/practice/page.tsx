import { SpeakingSession } from "@/features/speaking/components/session/speaking-session";

export default async function SpeakingPracticeRoute({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { testId } = await params;
  const { mode } = await searchParams;
  return <SpeakingSession mode={mode} testId={testId} />;
}
