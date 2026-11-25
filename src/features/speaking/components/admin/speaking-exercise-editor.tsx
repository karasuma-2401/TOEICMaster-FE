"use client";

import { AdminFilterSelect } from "@/features/admin/components/content/admin-filters";
import { useState } from "react";
import {
  adminGradient,
  adminInput,
  adminPrimary,
  adminSecondary,
  adminTextarea,
} from "@/features/admin/components/content/admin-styles";
import { AdminPanel } from "@/features/admin/components/content/admin-workspace";
import {
  createSpeakingExercise,
  updateSpeakingExercise,
} from "@/features/speaking/admin-api";
import { SpeakingApiError } from "@/features/speaking/http";
import { SpeakingWorkspaceDialog } from "./speaking-workspace-dialog";
import {
  fromSpeakingDraft,
  type SpeakingDraft,
} from "@/features/speaking/admin-draft";
import {
  difficultyLabel,
  difficultyOptions,
  exerciseStatusLabel,
  exerciseStatusOptions,
} from "@/features/speaking/admin-labels";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { ExerciseLivePreview } from "./exercise-live-preview";
import { SpeakingExerciseFields } from "./speaking-exercise-fields";

export function SpeakingExerciseEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: SpeakingDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const spec = speakingPartSpecs[draft.part];
  const update = <K extends keyof SpeakingDraft>(
    key: K,
    value: SpeakingDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };
  const save = async () => {
    const result = fromSpeakingDraft(draft);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSaving(true);
    try {
      if (draft.id)
        await updateSpeakingExercise(draft.id, draft.version, result.input);
      else await createSpeakingExercise(result.input);
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof SpeakingApiError && cause.status === 409
          ? "This exercise was modified elsewhere or has a duplicate code. Close and reopen to load the latest version."
          : cause instanceof SpeakingApiError &&
              Object.keys(cause.fieldErrors).length > 0
            ? Object.values(cause.fieldErrors).flat().join(" ")
            : cause instanceof Error
              ? cause.message
              : "Unable to save Speaking exercise.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <SpeakingWorkspaceDialog
      actions={
        <>
          <button className={adminSecondary} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={adminPrimary}
            disabled={saving}
            onClick={() => void save()}
            style={adminGradient}
            type="button"
          >
            {saving ? "Saving..." : "Save exercise"}
          </button>
        </>
      }
      badge={
        <span className="rounded-full bg-[var(--admin-surface-muted)] px-2 py-1 text-xs font-bold text-[var(--admin-muted)]">
          {exerciseStatusLabel[draft.status]}
        </span>
      }
      eyebrow={`SPEAKING PART ${draft.part} · ${spec.title.toUpperCase()}`}
      label="Speaking exercise form"
      onClose={onClose}
      title={draft.code || "New exercise"}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {error && (
            <p
              className="rounded-xl bg-[var(--admin-danger-soft)] p-3 text-sm font-semibold text-[var(--admin-danger)]"
              role="alert"
            >
              {error}
            </p>
          )}
          <AdminPanel
            description="Used for searching, filtering, and selecting exercises when assembling tests."
            title="General information"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Exercise code *
                <input
                  className={adminInput}
                  onChange={(event) => update("code", event.target.value)}
                  value={draft.code}
                />
              </label>
              <label className="text-sm font-semibold">
                Topic *
                <input
                  className={adminInput}
                  onChange={(event) => update("topic", event.target.value)}
                  value={draft.topic}
                />
              </label>
              <div className="text-sm font-semibold">
                Difficulty
                <AdminFilterSelect
                  ariaLabel="Difficulty"
                  onChange={(value: SpeakingDraft["difficulty"]) =>
                    update("difficulty", value)
                  }
                  options={difficultyOptions.map((value) => ({
                    value,
                    label: difficultyLabel[value],
                  }))}
                  value={draft.difficulty}
                  variant="field"
                />
              </div>
              <div className="text-sm font-semibold">
                Status
                <AdminFilterSelect
                  ariaLabel="Status"
                  onChange={(value: SpeakingDraft["status"]) =>
                    update("status", value)
                  }
                  options={exerciseStatusOptions.map((value) => ({
                    value,
                    label: exerciseStatusLabel[value],
                  }))}
                  value={draft.status}
                  variant="field"
                />
              </div>
            </div>
          </AdminPanel>
          <AdminPanel description={spec.description} title="Prompt content">
            <div className="space-y-4">
              <SpeakingExerciseFields draft={draft} update={update} />
            </div>
          </AdminPanel>
          <AdminPanel
            description="Hidden while the learner is taking the test; used for self-assessment and future AI grading."
            title="Scoring"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <label className="block text-sm font-semibold">
                Rubric notes
                <textarea
                  className={`${adminTextarea} min-h-32`}
                  onChange={(event) =>
                    update("rubricNotes", event.target.value)
                  }
                  value={draft.rubricNotes}
                />
              </label>
              <label className="block text-sm font-semibold">
                Model answer / sample response *
                <textarea
                  className={`${adminTextarea} min-h-32`}
                  onChange={(event) =>
                    update("modelAnswer", event.target.value)
                  }
                  value={draft.modelAnswer}
                />
              </label>
            </div>
          </AdminPanel>
        </div>
        <div>
          <ExerciseLivePreview draft={draft} />
        </div>
      </div>
    </SpeakingWorkspaceDialog>
  );
}
