import { notFound } from "next/navigation";
import { WritingPracticeLibrary } from "@/features/writing/components/writing-practice-library";

export default async function WritingPracticePage({
  params,
}: {
  params: Promise<{ part: string }>;
}) {
  const { part } = await params;
  if (part !== "1" && part !== "2" && part !== "3") notFound();
  return <WritingPracticeLibrary part={Number(part) as 1 | 2 | 3} />;
}
