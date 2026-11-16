import { notFound } from "next/navigation";
import { ListeningReadingPracticeDetail } from "@/features/listening-reading/components/listening-reading-practice-detail";
import { isListeningReadingPart } from "@/features/listening-reading/utils/listening-reading-utils";

type Props = {
  params: Promise<{
    part: string;
    itemId: string;
  }>;
};

export default async function ReadingPracticeDetailPage({
  params,
}: Props) {
  const { part, itemId } = await params;

  if (!isListeningReadingPart("reading", part)) {
    notFound();
  }

  return (
    <ListeningReadingPracticeDetail
      skill="reading"
      part={part}
      itemId={itemId}
    />
  );
}
