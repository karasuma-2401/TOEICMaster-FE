import { LrExamInstructions } from "@/features/lr-exam/components/lr-exam-instructions";

export default async function LrExamInstructionsRoute({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <LrExamInstructions examId={examId} />;
}
