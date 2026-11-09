"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createSpeakingTest,
  getSpeakingTestDetail,
  listSpeakingExercises,
  publishSpeakingTest,
  updateSpeakingTest,
  type SpeakingTestInput,
} from "@/features/speaking/admin-api";
import { SpeakingApiError } from "@/features/speaking/http";
import {
  partQuestionCount,
  questionsPerExercise,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
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
import { slotLabels, TestSlotPicker } from "./test-slot-picker";
import { ArrowLeftIcon } from "../ui/icons";
import { Chip, SpeakingLogo } from "../ui/primitives";

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

const firstQuestion: Record<SpeakingPart, number> = {
  1: 1,
  2: 3,
  3: 5,
  4: 8,
  5: 11,
};

/** Question numbers of a Part with the exercise that covers each one. */
function questionCells(part: SpeakingPart, selected: string[]) {
  const perSlot = questionsPerExercise(part);
  return Array.from({ length: partQuestionCount(part) }, (_, offset) => ({
    number: firstQuestion[part] + offset,
    id: selected[Math.floor(offset / perSlot)] || "",
  }));
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
  viewOnly = false,
  onClose,
  onSaved,
}: {
  /** `null` creates a new draft. */
  testId: string | null;
  /** Opens the test without any way to change it. */
  viewOnly?: boolean;
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
  const readOnly = viewOnly || saved?.status === "PUBLISHED";

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

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const input = compact(draft);
  const checklist = publishChecklist(input, lookup);
  const canPublish = checklist.every((item) => item.done);
  const filledIds = speakingParts.flatMap((part) => input.exerciseIds[part]);
  const duplicates = new Set(
    filledIds.filter((id, index) => filledIds.indexOf(id) !== index),
  );
  const slotCount = speakingParts.reduce(
    (sum, part) => sum + slotLabels[part].length,
    0,
  );
  const questionsFilled = speakingParts
    .flatMap((part) => questionCells(part, draft.exerciseIds[part]))
    .filter((cell) => cell.id).length;
  const inspect = () =>
    setErrors(
      canPublish
        ? []
        : ["Hoàn thành mọi điều kiện xuất bản trước khi công bố."],
    );

  return (
    <dialog
      aria-label="Test builder Speaking"
      aria-modal="true"
      className="fixed inset-0 z-[70] m-0 flex h-dvh max-h-none w-full max-w-none flex-col bg-(--sp-page) p-0 text-(--sp-ink)"
      open
    >
      <header className="flex min-h-16 flex-wrap items-center gap-4 border-b border-(--sp-line) bg-(--sp-surface) px-5 py-2">
        <SpeakingLogo />
        <span className="rounded-md bg-(--sp-danger-bg) px-2 py-0.5 text-[11px] font-semibold text-(--sp-danger)">
          ADMIN
        </span>
        <p className="text-[13px] text-(--sp-ink-3)">
          Kho dữ liệu / Đề thi / Speaking / Trình tạo đề
        </p>
      </header>
      <div className="flex min-h-[88px] flex-wrap items-center gap-4 border-b border-(--sp-line) bg-(--sp-surface) px-5 py-3">
        <button
          aria-label="Đóng test builder speaking"
          className="sp-focus cursor-pointer p-1"
          onClick={onClose}
          type="button"
        >
          <ArrowLeftIcon />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-[28px] font-semibold leading-9">
            Trình tạo đề thi <Chip tone="speak">Speaking</Chip>
          </h2>
          <p className="text-[13px] text-(--sp-ink-2)">
            {draft.title || "Đề Speaking mới"}
            {draft.code && ` / ${draft.code}`}
          </p>
        </div>
        {readOnly ? (
          <button
            className="sp-btn sp-btn-outline"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              className="sp-btn sp-btn-outline"
              disabled={busy || loading}
              onClick={() => void persist(false)}
              type="button"
            >
              Lưu bản nháp
            </button>
            <button
              className="sp-btn sp-btn-solid"
              disabled={busy || loading}
              onClick={inspect}
              type="button"
            >
              Kiểm tra đề
            </button>
            <button
              className="sp-btn sp-btn-cta"
              disabled={busy || loading || !canPublish}
              onClick={() => void persist(true)}
              type="button"
            >
              {busy ? "Đang lưu…" : "Công bố"}
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading || loadError ? (
          <div className="sp-card">
            <AdminLoadState
              error={loadError}
              loading={loading}
              onRetry={() => setAttempt((value) => value + 1)}
            />
          </div>
        ) : (
          <>
            {readOnly && (
              <p className="mb-4 rounded-xl bg-(--sp-success-bg) p-3 text-sm font-semibold text-(--sp-success)">
                Đề đã công bố và được khóa chỉnh sửa. Nội dung hiển thị là bản
                chụp lúc công bố.
              </p>
            )}
            <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_400px]">
              <div className="space-y-4">
                <TestInfoPanel
                  disabled={readOnly}
                  onChange={(next) => {
                    setDraft((current) => ({ ...current, ...next }));
                    setErrors([]);
                  }}
                  published={readOnly}
                  value={draft}
                />
                <section className="sp-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">Sơ đồ 11 câu</h3>
                    <span className="text-xs text-(--sp-ink-3)">
                      {questionsFilled}/11 câu
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {speakingParts.map((part) => (
                      <div className="flex items-center gap-3" key={part}>
                        <span className="w-12 text-xs text-(--sp-ink-2)">
                          Part {part}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {questionCells(part, draft.exerciseIds[part]).map(
                            (cell) => (
                              <button
                                aria-label={`Xem câu ${cell.number}`}
                                className={`sp-focus grid size-9 cursor-pointer place-items-center rounded-md text-xs font-semibold disabled:cursor-default ${cell.id && duplicates.has(cell.id) ? "bg-(--sp-danger-solid) text-white" : cell.id ? "bg-(--sp-success-solid) text-white" : "border border-(--sp-line) bg-(--sp-subtle)"} ${cell.id && cell.id === focusedId ? "outline-2 outline-(--sp-brand)" : ""}`}
                                disabled={!cell.id}
                                key={cell.number}
                                onClick={() => setFocusedId(cell.id)}
                                type="button"
                              >
                                {cell.number}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 flex gap-3 text-xs text-(--sp-ink-2)">
                    <span>
                      <span className="text-(--sp-success-solid)">●</span> Đủ
                      bài
                    </span>
                    <span>
                      <span className="text-(--sp-danger-solid)">●</span> Trùng
                    </span>
                    <span>
                      <span className="text-(--sp-ink-3)">●</span> Trống
                    </span>
                  </p>
                </section>
                <PublishChecklistPanel errors={errors} items={checklist} />
              </div>
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">Cấu trúc đề thi</h3>
                    <p className="text-[13px] text-(--sp-ink-2)">
                      Chọn bài cho từng slot. Nhóm câu hỏi luôn được thêm cùng
                      nhau.
                    </p>
                  </div>
                  <p className="text-xs text-(--sp-ink-3)">
                    5 Parts · {slotCount} slot · 11 câu
                  </p>
                </div>
                {speakingParts.map((part) => (
                  <TestSlotPicker
                    disabled={readOnly}
                    duplicates={duplicates}
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
                <p className="text-xs text-(--sp-ink-2)">
                  Part 3: Q5–7 là 1 nhóm. Part 4: tài liệu chung gắn với nhóm
                  Q8–10, không tạo slot riêng.
                </p>
              </div>
              <div className="min-w-0 lg:col-span-2 xl:col-span-1">
                <TestPreviewPanel focusedId={focusedId} lookup={lookup} />
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
