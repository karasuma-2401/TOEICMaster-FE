import type { ReactNode } from "react";
import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";
import { GuideMascot } from "@/shared/components/mascot/guide-mascot";

// Same frame as Writing, Listening & Reading and History: the shared learner
// font only, not the Speaking `sp-theme` look.
export default function PronunciationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`sp-font ${speakingFontClasses}`}>
      {children}
      <GuideMascot />
    </div>
  );
}
