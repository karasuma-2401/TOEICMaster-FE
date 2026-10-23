import { notFound } from "next/navigation";
import { WritingTestOverview } from "@/features/writing/components/writing-test-overview";
import { getWritingTest } from "@/features/writing/mock-data";

export default async function WritingTestRoute({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { testId } = await params;
  const { mode } = await searchParams;
  const test = getWritingTest(testId);

  if (!test) notFound();

  return <WritingTestOverview mode={mode} test={test} />;
}
