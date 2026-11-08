import type { ReactNode } from "react";
import { SpeakingHeader } from "../speaking-header";

/** Learner page frame: top navigation and the warm page background. */
export function SpPage({
  narrow = false,
  children,
}: {
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="sp-page">
      <SpeakingHeader />
      <main
        className={`sp-container ${narrow ? "sp-container-narrow" : ""} pb-16 pt-8`}
      >
        {children}
      </main>
    </div>
  );
}
