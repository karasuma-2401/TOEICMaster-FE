import { notFound } from "next/navigation";
import {
  isListeningReadingPart,
  ListeningReadingPractice,
} from "@/features/listening-reading/components/listening-reading-library";

export default async function ReadingPracticeRoute({
  params,
}: {
  params: Promise<{ part: string }>;
}) {
  const { part } = await params;
  if (!isListeningReadingPart("reading", part)) notFound();
  return <ListeningReadingPractice part={part} skill="reading" />;
}
