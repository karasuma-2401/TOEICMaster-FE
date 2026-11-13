import { LrExamRoom } from "@/features/lr-exam/components/lr-exam-room";
import { loadRoomState } from "@/features/lr-exam/loaders";

export default async function LrExamRoomRoute({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { examId } = await params;
  const { q } = await searchParams;
  const state = loadRoomState(examId, q ? Number(q) : undefined);
  return (
    <LrExamRoom
      {...state}
      resultHref="/exams/lr/attempts/demo-attempt/result"
    />
  );
}
