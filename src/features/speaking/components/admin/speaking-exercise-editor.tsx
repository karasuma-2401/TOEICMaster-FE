"use client";

import { useState } from "react";
import {
  adminGradient,
  adminInput,
  adminPrimary,
  adminSecondary,
  adminTextarea,
} from "@/features/admin/components/content/admin-styles";
import {
  AdminPanel,
  AdminWorkspace,
} from "@/features/admin/components/content/admin-workspace";
import {
  createSpeakingExercise,
  updateSpeakingExercise,
} from "@/features/speaking/admin-api";
import { SpeakingApiError } from "@/features/speaking/http";
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
          ? "Bài tập đã bị thay đổi ở nơi khác hoặc trùng mã. Đóng và mở lại để tải bản mới."
          : cause instanceof SpeakingApiError &&
              Object.keys(cause.fieldErrors).length > 0
            ? Object.values(cause.fieldErrors).join(" ")
            : cause instanceof Error
              ? cause.message
              : "Không thể lưu bài tập Speaking.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <AdminWorkspace
      actions={
        <>
          <button className={adminSecondary} onClick={onClose} type="button">
            Hủy
          </button>
          <button
            className={adminPrimary}
            disabled={saving}
            onClick={() => void save()}
            style={adminGradient}
            type="button"
          >
            {saving ? "Đang lưu…" : "Lưu bài tập"}
          </button>
        </>
      }
      badge={
        <span className="rounded-full bg-[var(--admin-surface-muted)] px-2 py-1 text-xs font-bold text-[var(--admin-muted)]">
          {exerciseStatusLabel[draft.status]}
        </span>
      }
      eyebrow={`SPEAKING PART ${draft.part} · ${spec.title.toUpperCase()}`}
      label="Form bài tập Speaking"
      onClose={onClose}
      title={draft.code || "Bài tập mới"}
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
            description="Dùng để tìm kiếm, lọc và chọn bài khi lắp đề."
            title="Thông tin chung"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Mã bài *
                <input
                  className={adminInput}
                  onChange={(event) => update("code", event.target.value)}
                  value={draft.code}
                />
              </label>
              <label className="text-sm font-semibold">
                Chủ đề *
                <input
                  className={adminInput}
                  onChange={(event) => update("topic", event.target.value)}
                  value={draft.topic}
                />
              </label>
              <label className="text-sm font-semibold">
                Độ khó
                <select
                  className={adminInput}
                  onChange={(event) =>
                    update(
                      "difficulty",
                      event.target.value as SpeakingDraft["difficulty"],
                    )
                  }
                  value={draft.difficulty}
                >
                  {difficultyOptions.map((item) => (
                    <option key={item} value={item}>
                      {difficultyLabel[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Trạng thái
                <select
                  className={adminInput}
                  onChange={(event) =>
                    update(
                      "status",
                      event.target.value as SpeakingDraft["status"],
                    )
                  }
                  value={draft.status}
                >
                  {exerciseStatusOptions.map((item) => (
                    <option key={item} value={item}>
                      {exerciseStatusLabel[item]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </AdminPanel>
          <AdminPanel description={spec.description} title="Nội dung đề">
            <div className="space-y-4">
              <SpeakingExerciseFields draft={draft} update={update} />
            </div>
          </AdminPanel>
          <AdminPanel
            description="Không hiển thị khi User đang làm bài; dùng cho phần tự đánh giá và chấm AI sau này."
            title="Chấm điểm"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <label className="block text-sm font-semibold">
                Tiêu chí chấm
                <textarea
                  className={`${adminTextarea} min-h-32`}
                  onChange={(event) =>
                    update("rubricNotes", event.target.value)
                  }
                  value={draft.rubricNotes}
                />
              </label>
              <label className="block text-sm font-semibold">
                Bài mẫu / gợi ý trả lời *
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
    </AdminWorkspace>
  );
}
