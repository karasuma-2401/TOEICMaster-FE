import type { ReactNode } from "react";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import type { SpeakingPart } from "@/features/speaking/types";

/** Part heading and TOEIC directions wrapped around a question stimulus. */
export function PromptFrame({
  part,
  showDirections = true,
  children,
}: {
  part: SpeakingPart;
  showDirections?: boolean;
  children: ReactNode;
}) {
  const spec = speakingPartSpecs[part];
  return (
    <div>
      {showDirections && (
        <details className="group mb-5 rounded-2xl border border-(--sp-line) bg-(--sp-subtle) px-4 py-3 text-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-(--sp-ink-2) focus-visible:outline-2 focus-visible:outline-(--sp-brand)">
            <span>Directions · {spec.title}</span>
            <span
              aria-hidden="true"
              className="text-(--sp-ink-3) transition group-open:rotate-180"
            >
              ⌄
            </span>
          </summary>
          <p className="mt-2 max-w-prose leading-6 text-(--sp-ink-2)" lang="en">
            {spec.directions}
          </p>
        </details>
      )}
      {children}
    </div>
  );
}
