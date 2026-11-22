import type { ReactNode } from "react";
import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";
import { UserMenu } from "@/features/user/components/user-menu";
import { SkillHeader } from "@/shared/components/practice/skill-header";
import "@/features/knowledge/knowledge-reading.css";

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`sp-font ${speakingFontClasses} min-h-dvh bg-[#f7f6f4]`}>
      <SkillHeader account={<UserMenu />} />
      <main
        className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
