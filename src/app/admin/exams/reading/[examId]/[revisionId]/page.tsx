import { ReadingExamWorkspace } from "@/features/admin/components/reading-exam-workspace";

export default async function ReadingExamPage({
  params,
}: {
  params: Promise<{ examId: string; revisionId: string }>;
}) {
  const { examId, revisionId } = await params;
  return <ReadingExamWorkspace examId={examId} revisionId={revisionId} />;
}
