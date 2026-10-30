import { WritingTestOverview } from "@/features/writing/components/writing-test-overview";

export default async function WritingTestRoute({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { testId } = await params;
  const { mode } = await searchParams;
  return <WritingTestOverview mode={mode} testId={testId} />;
}
