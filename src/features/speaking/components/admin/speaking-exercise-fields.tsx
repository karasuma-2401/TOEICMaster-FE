import type { SpeakingDraft } from "@/features/speaking/admin-draft";
import { ImageUploadField } from "./image-upload-field";
import {
  adminInput,
  adminTextarea,
} from "@/features/admin/components/content/admin-styles";

type Update = <K extends keyof SpeakingDraft>(
  key: K,
  value: SpeakingDraft[K],
) => void;

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {multiline ? (
        <textarea
          className={adminTextarea}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      ) : (
        <input
          className={adminInput}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      )}
      {hint && (
        <span className="mt-1 block text-xs font-normal text-[var(--admin-muted)]">
          {hint}
        </span>
      )}
    </label>
  );
}

function QuestionFields({
  draft,
  update,
  timing,
  disabled,
}: {
  draft: SpeakingDraft;
  update: Update;
  timing: string[];
  disabled: boolean;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-[var(--admin-border)] p-4">
      <legend className="px-1 text-sm font-bold">3 questions *</legend>
      {draft.questions.map((question, index) => (
        <TextField
          hint={timing[index]}
          key={index}
          label={`Question ${index + 1}`}
          onChange={(value) =>
            update(
              "questions",
              draft.questions.map((item, current) =>
                current === index ? value : item,
              ) as SpeakingDraft["questions"],
            )
          }
          value={question}
          disabled={disabled}
        />
      ))}
    </fieldset>
  );
}

/** Part-specific inputs for the Speaking exercise drawer. */
export function SpeakingExerciseFields({
  draft,
  update,
  disabled = false,
}: {
  draft: SpeakingDraft;
  update: Update;
  disabled?: boolean;
}) {
  switch (draft.part) {
    case 1:
      return (
        <TextField
          hint="About 60-90 words, 45s prep · 45s read aloud."
          label="Read-aloud passage *"
          multiline
          onChange={(value) => update("passage", value)}
          value={draft.passage}
          disabled={disabled}
        />
      );
    case 2:
      return (
        <>
          <ImageUploadField
            imageUrl={draft.imageUrl}
            onUploaded={(id, url) => {
              update("imageAssetId", id);
              update("imageUrl", url);
            }}
            disabled={disabled}
          />
          <TextField
            hint="Used as alt text for screen reader users."
            label="Image description *"
            multiline
            onChange={(value) => update("imageAlt", value)}
            value={draft.imageAlt}
            disabled={disabled}
          />
        </>
      );
    case 3:
      return (
        <>
          <TextField
            label="Interview context *"
            multiline
            onChange={(value) => update("context", value)}
            value={draft.context}
            disabled={disabled}
          />
          <QuestionFields
            draft={draft}
            timing={["15s response", "15s response", "30s response"]}
            update={update}
            disabled={disabled}
          />
        </>
      );
    case 4:
      return (
        <>
          <TextField
            label="Document title *"
            onChange={(value) => update("documentTitle", value)}
            value={draft.documentTitle}
            disabled={disabled}
          />
          <TextField
            hint="One item per line: label | value (e.g., 9:00 | Registration)."
            label="Information table *"
            multiline
            onChange={(value) => update("documentRows", value)}
            value={draft.documentRows}
            disabled={disabled}
          />
          <TextField
            label="Caller introduction"
            multiline
            onChange={(value) => update("callerIntro", value)}
            value={draft.callerIntro}
            disabled={disabled}
          />
          <QuestionFields
            draft={draft}
            timing={["15s response", "15s response", "30s response"]}
            update={update}
            disabled={disabled}
          />
        </>
      );
    case 5:
      return (
        <TextField
          hint="45s prep · 60s response."
          label="Opinion prompt *"
          multiline
          onChange={(value) => update("prompt", value)}
          value={draft.prompt}
          disabled={disabled}
        />
      );
  }
}
