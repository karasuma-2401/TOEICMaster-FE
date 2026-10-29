import { SpeakingSession } from "@/features/speaking/components/session/speaking-session";

export default async function SpeakingExercisePracticeRoute({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  return <SpeakingSession source={{ kind: "exercise", exerciseId }} />;
}
