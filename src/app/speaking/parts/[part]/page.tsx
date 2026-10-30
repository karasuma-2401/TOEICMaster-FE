import { notFound } from "next/navigation";
import { SpeakingPartLibrary } from "@/features/speaking/components/speaking-part-library";
import { speakingParts, type SpeakingPart } from "@/features/speaking/types";

export default async function SpeakingPartRoute({
  params,
}: {
  params: Promise<{ part: string }>;
}) {
  const part = Number((await params).part);
  if (!speakingParts.includes(part as SpeakingPart)) notFound();
  return <SpeakingPartLibrary part={part as SpeakingPart} />;
}
