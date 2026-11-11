import { notFound } from "next/navigation";
import { AdminSpeakingContentPage } from "@/features/speaking/components/admin/admin-speaking-content-page";
import type { SpeakingPart } from "@/features/speaking/types";

export default async function AdminSpeakingPartContentRoute({
  params,
}: {
  params: Promise<{ part: string }>;
}) {
  const { part } = await params;
  const match = /^part-([1-5])$/.exec(part);
  if (!match) notFound();

  return <AdminSpeakingContentPage part={Number(match[1]) as SpeakingPart} />;
}
