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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {multiline ? (
        <textarea
          className={adminTextarea}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      ) : (
        <input
          className={adminInput}
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
}: {
  draft: SpeakingDraft;
  update: Update;
  timing: string[];
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-[var(--admin-border)] p-4">
      <legend className="px-1 text-sm font-bold">3 câu hỏi *</legend>
      {draft.questions.map((question, index) => (
        <TextField
          hint={timing[index]}
          key={index}
          label={`Câu hỏi ${index + 1}`}
          onChange={(value) =>
            update(
              "questions",
              draft.questions.map((item, current) =>
                current === index ? value : item,
              ) as SpeakingDraft["questions"],
            )
          }
          value={question}
        />
      ))}
    </fieldset>
  );
}

/** Part-specific inputs for the Speaking exercise drawer. */
export function SpeakingExerciseFields({
  draft,
  update,
}: {
  draft: SpeakingDraft;
  update: Update;
}) {
  switch (draft.part) {
    case 1:
      return (
        <TextField
          hint="Khoảng 60–90 từ, chuẩn bị 45s · đọc 45s."
          label="Đoạn văn đọc to *"
          multiline
          onChange={(value) => update("passage", value)}
          value={draft.passage}
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
          />
          <TextField
            hint="Dùng làm alt text cho người dùng trình đọc màn hình."
            label="Mô tả ảnh *"
            multiline
            onChange={(value) => update("imageAlt", value)}
            value={draft.imageAlt}
          />
        </>
      );
    case 3:
      return (
        <>
          <TextField
            label="Bối cảnh cuộc phỏng vấn *"
            multiline
            onChange={(value) => update("context", value)}
            value={draft.context}
          />
          <QuestionFields
            draft={draft}
            timing={["Trả lời 15s", "Trả lời 15s", "Trả lời 30s"]}
            update={update}
          />
        </>
      );
    case 4:
      return (
        <>
          <TextField
            label="Tiêu đề tài liệu *"
            onChange={(value) => update("documentTitle", value)}
            value={draft.documentTitle}
          />
          <TextField
            hint="Mỗi dòng một mục: nhãn | nội dung (ví dụ: 9:00 | Registration)."
            label="Bảng thông tin *"
            multiline
            onChange={(value) => update("documentRows", value)}
            value={draft.documentRows}
          />
          <TextField
            label="Lời mở đầu của người gọi"
            multiline
            onChange={(value) => update("callerIntro", value)}
            value={draft.callerIntro}
          />
          <QuestionFields
            draft={draft}
            timing={["Trả lời 15s", "Trả lời 15s", "Trả lời 30s"]}
            update={update}
          />
        </>
      );
    case 5:
      return (
        <TextField
          hint="Chuẩn bị 45s · trả lời 60s."
          label="Đề bài nêu quan điểm *"
          multiline
          onChange={(value) => update("prompt", value)}
          value={draft.prompt}
        />
      );
  }
}
