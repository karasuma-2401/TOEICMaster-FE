"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminGradient,
  adminPrimary,
  adminSecondary,
} from "@/features/admin/components/content/admin-styles";
import { AdminWorkspace } from "@/features/admin/components/content/admin-workspace";
import {
  createSpeakingTest,
  getSpeakingTestDetail,
  listSpeakingExercises,
  publishSpeakingTest,
  updateSpeakingTest,
  type SpeakingTestInput,
} from "@/features/speaking/admin-api";
import { SpeakingApiError } from "@/features/speaking/http";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { publishChecklist } from "@/features/speaking/publish-checklist";
import {
  speakingParts,
  type SpeakingExercise,
  type SpeakingPart,
  type SpeakingTest,
} from "@/features/speaking/types";
import { AdminLoadState, errorMessage } from "./admin-load-state";
import { PublishChecklistPanel } from "./publish-checklist-panel";
import { TestInfoPanel } from "./test-info-panel";
import { TestPreviewPanel } from "./test-preview-panel";
import { TestSlotPicker } from "./test-slot-picker";

const emptyDraft: SpeakingTestInput = {
  code: "",
  title: "",
  description: "",
  exerciseIds: { 1: [], 2: [], 3: [], 4: [], 5: [] },
};

function compact(draft: SpeakingTestInput): SpeakingTestInput {
  return {
    ...draft,
    exerciseIds: Object.fromEntries(
      speakingParts.map((part) => [
        part,
        draft.exerciseIds[part].filter(Boolean),
      ]),
    ) as SpeakingTestInput["exerciseIds"],
  };
}

function saveError(cause: unknown) {
  if (cause instanceof SpeakingApiError && cause.status === 409)
    return [
      "Đề đã bị thay đổi ở nơi khác hoặc trùng mã. Đóng và mở lại để tải bản mới.",
    ];
  if (
    cause instanceof SpeakingApiError &&
    Object.keys(cause.fieldErrors).length > 0
  )
    return Object.values(cause.fieldErrors);
  return [errorMessage(cause, "Không thể lưu đề Speaking.")];
}

export function SpeakingTestWorkspace({
  testId,
  onClose,
  onSaved,
}: {
  /** `null` creates a new draft. */
  testId: string | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [saved, setSaved] = useState<SpeakingTest | null>(null);
  const [draft, setDraft] = useState<SpeakingTestInput>(emptyDraft);
  const [bank, setBank] = useState<SpeakingExercise[]>([]);
  const [linked, setLinked] = useState<SpeakingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const task = window.setTimeout(async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [published, detail] = await Promise.all([
          listSpeakingExercises(
            { status: "PUBLISHED", pageNumber: 1, pageSize: 100 },
            signal,
          ),
          testId ? getSpeakingTestDetail(testId, signal) : null,
        ]);
        setBank(published.items);
        if (detail) {
          setSaved(detail.test);
          setLinked(detail.exercises);
          setDraft({
            code: detail.test.code,
            title: detail.test.title,
            description: detail.test.description,
            exerciseIds: detail.test.exerciseIds,
          });
          setFocusedId(
            speakingParts
              .map((part) => detail.test.exerciseIds[part][0])
              .find(Boolean) ?? null,
          );
        }
      } catch (cause) {
        if (!signal.aborted)
          setLoadError(errorMessage(cause, "Không thể tải đề Speaking."));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }, 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [attempt, testId]);

  const lookup = useMemo(() => {
    const byId = new Map(
      [...linked, ...bank].map((exercise) => [exercise.id, exercise]),
    );
    return (id: string) => byId.get(id);
  }, [bank, linked]);
  const readOnly = saved?.status === "PUBLISHED";

  const replaceSlot = (part: SpeakingPart, index: number, id: string) => {
    setDraft((current) => {
      const slots = Array.from(
        { length: speakingPartSpecs[part].slots },
        (_, slot) => current.exerciseIds[part][slot] ?? "",
      );
      slots[index] = id;
      return {
        ...current,
        exerciseIds: { ...current.exerciseIds, [part]: slots },
      };
    });
    if (id) setFocusedId(id);
    setErrors([]);
  };

  const persist = async (publish: boolean) => {
    const input = compact(draft);
    if (!input.code.trim() || !input.title.trim()) {
      setErrors(["Mã đề và tên đề là bắt buộc."]);
      return;
    }
    if (publish && publishChecklist(input, lookup).some((item) => !item.done)) {
      setErrors(["Hoàn thành mọi điều kiện xuất bản trước khi công bố."]);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      let current = saved
        ? (await updateSpeakingTest(saved.id, saved.version, input)).test
        : (await createSpeakingTest(input)).test;
      setSaved(current);
      if (publish)
        current = (await publishSpeakingTest(current.id, current.version)).test;
      onSaved(
        publish
          ? `Đã công bố ${current.code}.`
          : `Đã lưu bản nháp ${current.code}.`,
      );
    } catch (cause) {
      setErrors(saveError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminWorkspace
      actions={
        readOnly ? (
          <button className={adminSecondary} onClick={onClose} type="button">
            Đóng
          </button>
        ) : (
          <>
            <button className={adminSecondary} onClick={onClose} type="button">
              Hủy
            </button>
            <button
              className={adminSecondary}
              disabled={busy || loading}
              onClick={() => void persist(false)}
              type="button"
            >
              Lưu bản nháp
            </button>
            <button
              className={adminPrimary}
              disabled={busy || loading}
              onClick={() => void persist(true)}
              style={adminGradient}
              type="button"
            >
              {busy ? "Đang lưu…" : "Xuất bản đề"}
            </button>
          </>
        )
      }
      badge={
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${readOnly ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"}`}
        >
          {readOnly ? "Công bố" : saved ? "Bản nháp" : "Chưa lưu"}
        </span>
      }
      eyebrow="TEST BUILDER · 2/2/3/3/1 CÂU"
      label="Test builder Speaking"
      onClose={onClose}
      title={draft.code || "Đề Speaking mới"}
    >
      {loading || loadError ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <AdminLoadState
            error={loadError}
            loading={loading}
            onRetry={() => setAttempt((value) => value + 1)}
          />
        </div>
      ) : (
        <>
          {readOnly && (
            <p className="mb-6 rounded-xl bg-[var(--admin-success-soft)] p-3 text-sm font-semibold text-[var(--admin-success)]">
              Đề đã công bố và được khóa chỉnh sửa. Nội dung hiển thị là bản
              chụp lúc công bố.
            </p>
          )}
          <div className="grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)_minmax(22rem,28rem)]">
            <div className="space-y-6">
              <TestInfoPanel
                disabled={readOnly}
                onChange={(next) => {
                  setDraft((current) => ({ ...current, ...next }));
                  setErrors([]);
                }}
                value={draft}
              />
              <PublishChecklistPanel
                errors={errors}
                items={publishChecklist(compact(draft), lookup)}
              />
            </div>
            <div className="grid content-start gap-6 2xl:grid-cols-2">
              {speakingParts.map((part) => (
                <TestSlotPicker
                  disabled={readOnly}
                  focusedId={focusedId}
                  key={part}
                  lookup={lookup}
                  onChange={(index, id) => replaceSlot(part, index, id)}
                  onFocus={setFocusedId}
                  options={bank.filter((exercise) => exercise.part === part)}
                  part={part}
                  selected={draft.exerciseIds[part]}
                />
              ))}
            </div>
            <div className="lg:col-span-2 xl:col-span-1">
              <TestPreviewPanel
                focusedId={focusedId}
                lookup={lookup}
                test={draft}
              />
            </div>
          </div>
        </>
      )}
    </AdminWorkspace>
  );
}
