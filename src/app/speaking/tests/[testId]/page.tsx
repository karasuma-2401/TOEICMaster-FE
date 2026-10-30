import { SpeakingTestOverview } from "@/features/speaking/components/speaking-test-overview";

export default async function SpeakingTestRoute({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { testId } = await params;
  const { mode } = await searchParams;
  return <SpeakingTestOverview mode={mode} testId={testId} />;
}
