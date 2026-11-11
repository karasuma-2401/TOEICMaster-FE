import type { ReactNode } from "react";
import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";
import "@/features/speaking/speaking-learner.css";
import { GuideMascot } from "@/shared/components/mascot/guide-mascot";

export default function SpeakingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`sp-theme sp-learner ${speakingFontClasses}`}>
      {children}
      <GuideMascot />
    </div>
  );
}
