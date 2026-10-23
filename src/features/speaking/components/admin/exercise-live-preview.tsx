import { AdminPanel } from "@/features/admin/components/content/admin-workspace";
import {
  previewFromDraft,
  type SpeakingDraft,
} from "@/features/speaking/admin-draft";
import { partTimingLabel } from "@/features/speaking/part-specs";
import { SpeakingPrompt } from "../prompts/speaking-prompt";

/** Learner-facing render of the exercise being edited, updated on every keystroke. */
export function ExerciseLivePreview({ draft }: { draft: SpeakingDraft }) {
  return (
    <AdminPanel
      aside={
        <span className="rounded-full bg-[var(--admin-nav-active)] px-2 py-1 text-[11px] font-bold text-[var(--admin-brand-red)]">
          Cập nhật trực tiếp
        </span>
      }
      className="lg:sticky lg:top-0"
      description={partTimingLabel(draft.part)}
      title="Góc nhìn User"
    >
      <div className="rounded-xl bg-stone-50 p-4 text-slate-900 sm:p-5">
        <SpeakingPrompt content={previewFromDraft(draft)} showAllQuestions />
      </div>
    </AdminPanel>
  );
}
