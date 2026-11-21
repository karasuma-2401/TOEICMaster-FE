import type { ReactNode } from "react";
import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";
import "@/features/speaking/speaking-learner.css";
import { GuideMascot } from "@/shared/components/mascot/guide-mascot";
import { MicSessionProvider } from "@/features/speaking/mic/mic-session-provider";

export default function SpeakingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`sp-theme sp-learner ${speakingFontClasses}`}>
      <MicSessionProvider>{children}</MicSessionProvider>
      <GuideMascot />
    </div>
  );
}
