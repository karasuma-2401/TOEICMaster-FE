import { LrResultReportView } from "@/features/lr-exam/components/lr-result-report";
import { loadResult } from "@/features/lr-exam/loaders";

export default async function LrResultRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return (
    <LrResultReportView
      examHref="/exams/lr/ets-2024-test-01"
      report={loadResult(attemptId)}
      reviewHref={`/exams/lr/attempts/${attemptId}/review`}
    />
  );
}
