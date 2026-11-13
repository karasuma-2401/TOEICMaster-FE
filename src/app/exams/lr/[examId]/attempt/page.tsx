import { redirect } from "next/navigation";

export default async function LegacyLrAttemptRoute({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  redirect(`/exams/lr/${examId}`);
}
