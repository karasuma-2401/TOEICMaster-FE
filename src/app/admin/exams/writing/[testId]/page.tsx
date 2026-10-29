import { WritingTestWorkspace } from "@/features/admin/components/writing-test-workspace";

export default async function WritingTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  return <WritingTestWorkspace testId={testId} />;
}
