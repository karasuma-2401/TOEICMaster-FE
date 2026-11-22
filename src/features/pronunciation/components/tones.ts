import type { ScoreBand } from "../assessment";

// Class tokens of the IPA page. Colours come from the shared learner theme
// (`--sp-*` inside `.sp-theme`, as used by ExamLibrary); scores add the only
// extra colour.

/** Bordered pill, same as the Part links of the exam library. */
export const pill =
  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[10px] border px-4 text-sm transition hover:border-(--sp-hero-line)";
export const pillIdle = "border-(--sp-line)/70 bg-white text-(--sp-ink-2)";
export const pillActive =
  "border-(--sp-hero-line) bg-(--sp-orange-soft) font-semibold text-(--sp-brand)";

/** White card with the library border and hover. */
export const card = "rounded-2xl border border-(--sp-line)/70 bg-white";

export const bandText: Record<ScoreBand, string> = {
  good: "text-(--sp-success)",
  fair: "text-(--sp-warning)",
  weak: "text-(--sp-danger)",
};
