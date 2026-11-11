import type { ReactNode } from "react";
import { PracticePage } from "@/shared/components/practice/practice-page";
import { SpeakingHeader } from "../speaking-header";

/** Learner page frame, the same one the other skills use. */
export function SpPage({
  narrow = false,
  children,
}: {
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <PracticePage className="pb-16 pt-8" header={<SpeakingHeader />}>
      {narrow ? (
        <div className="mx-auto w-full max-w-[1100px]">{children}</div>
      ) : (
        children
      )}
    </PracticePage>
  );
}
