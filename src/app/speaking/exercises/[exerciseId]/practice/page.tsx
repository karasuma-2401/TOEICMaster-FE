import { SpeakingPracticeEntry } from "@/features/speaking/components/session/speaking-practice";

export default async function SpeakingExercisePracticeRoute({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  return <SpeakingPracticeEntry exerciseId={exerciseId} key={exerciseId} />;
}
