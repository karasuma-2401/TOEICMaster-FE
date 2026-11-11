import { notFound } from "next/navigation";
import { AdminWritingContentPage } from "@/features/writing/components/admin-writing-pages";
import type { WritingPart } from "@/features/writing/types";

export default async function AdminWritingPartContentRoute({
  params,
}: {
  params: Promise<{ part: string }>;
}) {
  const { part } = await params;
  const match = /^part-([1-3])$/.exec(part);
  if (!match) notFound();

  return <AdminWritingContentPage part={Number(match[1]) as WritingPart} />;
}
