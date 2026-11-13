import { LrExamInstructions } from "@/features/lr-exam/components/lr-exam-instructions";
import { loadExamSummary } from "@/features/lr-exam/loaders";

export default async function LrExamInstructionsRoute({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <LrExamInstructions exam={loadExamSummary(examId)} />;
}
