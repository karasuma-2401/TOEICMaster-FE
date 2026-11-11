"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminGradient,
  adminPrimary,
  adminSecondary,
  adminTextarea,
} from "@/features/admin/components/content/admin-styles";
import {
  AdminPanel,
  AdminWorkspace,
} from "@/features/admin/components/content/admin-workspace";
import {
  createSpeakingTest,
  getSpeakingTestDetail,
  publishSpeakingTest,
  updateSpeakingTest,
  type SpeakingTestInput,
} from "@/features/speaking/admin-api";
import {
  formatDocumentRows,
  fromSpeakingDraft,
  parseDocumentRows,
  toSpeakingDraft,
  type SpeakingDraft,
} from "@/features/speaking/admin-draft";
import { SpeakingApiError } from "@/features/speaking/http";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import {
  speakingParts,
  type SpeakingExercise,
  type SpeakingPart,
  type SpeakingTest,
  type SpeakingTestQuestion,
} from "@/features/speaking/types";
import { AdminLoadState, errorMessage } from "./admin-load-state";
import { PublishChecklistPanel } from "./publish-checklist-panel";
import { SpeakingExerciseFields } from "./speaking-exercise-fields";
import { TestInfoPanel } from "./test-info-panel";

type TestMetadata = Pick<SpeakingTest, "code" | "title" | "description">;
type DirectQuestionDrafts = Record<SpeakingPart, SpeakingDraft[]>;

const emptyMetadata: TestMetadata = { code: "", title: "", description: "" };

function blankQuestion(part: SpeakingPart): SpeakingDraft {
  return {
    ...toSpeakingDraft(undefined, part),
    code: "DIRECT",
    topic: "Nội dung đề",
    difficulty: "MEDIUM",
    status: "DRAFT",
  };
}

function emptyQuestions(): DirectQuestionDrafts {
  return Object.fromEntries(
    speakingParts.map((part) => [
      part,
      Array.from({ length: speakingPartSpecs[part].slots }, () =>
        blankQuestion(part),
      ),
    ]),
  ) as DirectQuestionDrafts;
}

function fromQuestion(question: SpeakingTestQuestion): SpeakingDraft {
  const content = question.content;
  return {
    ...blankQuestion(question.part),
    rubricNotes: content.rubricNotes,
    modelAnswer: content.modelAnswer,
    passage: content.passage ?? "",
    imageAssetId: content.imageAssetId ?? null,
    imageUrl: content.imageAssetId
      ? `/api/admin/speaking/media/${encodeURIComponent(content.imageAssetId)}`
      : null,
    imageAlt: content.imageAlt ?? "",
    context: content.context ?? "",
    documentTitle: content.documentTitle ?? "",
    documentRows: formatDocumentRows(content.documentRows ?? []),
    callerIntro: content.callerIntro ?? "",
    questions: [
      content.questions?.[0] ?? "",
      content.questions?.[1] ?? "",
      content.questions?.[2] ?? "",
    ],
    prompt: content.prompt ?? "",
  };
}

function questionDrafts(test: SpeakingTest): DirectQuestionDrafts {
  const result = emptyQuestions();
  for (const question of test.questions) {
    const index = question.sequenceNumber - 1;
    if (result[question.part][index])
      result[question.part][index] = fromQuestion(question);
  }
  return result;
}

function toDirectQuestion(
  draft: SpeakingDraft,
  sequenceNumber: number,
): SpeakingTestQuestion {
  const base = {
    rubricNotes: draft.rubricNotes,
    modelAnswer: draft.modelAnswer,
  };
  switch (draft.part) {
    case 1:
      return {
        part: 1,
        sequenceNumber,
        content: { ...base, passage: draft.passage },
      };
    case 2:
      return {
        part: 2,
        sequenceNumber,
        content: {
          ...base,
          imageAssetId: draft.imageAssetId,
          imageAlt: draft.imageAlt,
        },
      };
    case 3:
      return {
        part: 3,
        sequenceNumber,
        content: {
          ...base,
          context: draft.context,
          questions: draft.questions,
        },
      };
    case 4:
      return {
        part: 4,
        sequenceNumber,
        content: {
          ...base,
          documentTitle: draft.documentTitle,
          documentRows: parseDocumentRows(draft.documentRows),
          callerIntro: draft.callerIntro,
          questions: draft.questions,
        },
      };
    case 5:
      return {
        part: 5,
        sequenceNumber,
        content: { ...base, prompt: draft.prompt },
      };
  }
}

function isDirectQuestionComplete(draft: SpeakingDraft) {
  return "input" in fromSpeakingDraft(draft);
}

function saveError(cause: unknown) {
  if (cause instanceof SpeakingApiError && cause.status === 409)
    return [
      "Đề đã bị thay đổi ở nơi khác hoặc trùng mã. Hãy tải lại để so sánh.",
    ];
  if (
    cause instanceof SpeakingApiError &&
    Object.keys(cause.fieldErrors).length > 0
  )
    return Object.values(cause.fieldErrors).flat();
  return [errorMessage(cause, "Không thể lưu đề Speaking.")];
}

export function SpeakingTestWorkspace({
  testId,
  onClose,
  onSaved,
}: {
  /** `null` creates a new direct-authoring draft. */
  testId: string | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [saved, setSaved] = useState<SpeakingTest | null>(null);
  const [metadata, setMetadata] = useState<TestMetadata>(emptyMetadata);
  const [questions, setQuestions] =
    useState<DirectQuestionDrafts>(emptyQuestions);
  const [legacyExercises, setLegacyExercises] = useState<SpeakingExercise[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(async () => {
      setLoading(true);
      setLoadError(null);
      try {
        if (!testId) {
          setSaved(null);
          setMetadata(emptyMetadata);
          setQuestions(emptyQuestions());
          setLegacyExercises([]);
          return;
        }
        const detail = await getSpeakingTestDetail(testId, controller.signal);
        setSaved(detail.test);
        setMetadata({
          code: detail.test.code,
          title: detail.test.title,
          description: detail.test.description,
        });
        setQuestions(questionDrafts(detail.test));
        setLegacyExercises(detail.exercises);
      } catch (cause) {
        if (!controller.signal.aborted)
          setLoadError(errorMessage(cause, "Không thể tải đề Speaking."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [attempt, testId]);

  const legacy = saved?.contentMode === "EXERCISE_BANK";
  const readOnly = saved?.status === "PUBLISHED" && !legacy;
  const directQuestions = useMemo(
    () =>
      speakingParts.flatMap((part) =>
        questions[part].map((draft, index) =>
          toDirectQuestion(draft, index + 1),
        ),
      ),
    [questions],
  );
  const completedDirectQuestions = useMemo(
    () =>
      speakingParts.flatMap((part) =>
        questions[part].filter((draft) => isDirectQuestionComplete(draft)),
      ),
    [questions],
  );
  const expectedSlots = speakingParts.reduce(
    (total, part) => total + speakingPartSpecs[part].slots,
    0,
  );
  const checklist = speakingParts.map((part) => {
    const completed = completedDirectQuestions.filter(
      (draft) => draft.part === part,
    ).length;
    const expected = speakingPartSpecs[part].slots;
    return {
      id: `part-${part}`,
      done: completed === expected,
      label: `Part ${part}: hoàn thiện ${completed}/${expected} nhóm nội dung`,
    };
  });

  const updateQuestion = (
    part: SpeakingPart,
    index: number,
    update: (current: SpeakingDraft) => SpeakingDraft,
  ) => {
    setQuestions((current) => ({
      ...current,
      [part]: current[part].map((draft, currentIndex) =>
        currentIndex === index ? update(draft) : draft,
      ),
    }));
    setErrors([]);
  };

  const input = (): SpeakingTestInput =>
    legacy
      ? {
          ...metadata,
          contentMode: "EXERCISE_BANK",
          exerciseIds: undefined,
        }
      : {
          ...metadata,
          contentMode: "DIRECT",
          questions: directQuestions,
        };

  const persist = async (publish: boolean) => {
    if (!metadata.code.trim() || !metadata.title.trim()) {
      setErrors(["Mã đề và tên đề là bắt buộc."]);
      return;
    }
    if (
      publish &&
      !legacy &&
      completedDirectQuestions.length !== expectedSlots
    ) {
      setErrors([
        "Hoàn thành toàn bộ 7 nhóm nội dung / 11 câu trước khi xuất bản.",
      ]);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      let current = saved
        ? (await updateSpeakingTest(saved.id, saved.version, input())).test
        : (await createSpeakingTest(input())).test;
      setSaved(current);
      if (publish)
        current = (await publishSpeakingTest(current.id, current.version)).test;
      setSaved(current);
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
        <>
          <button className={adminSecondary} onClick={onClose} type="button">
            {readOnly ? "Đóng" : "Đóng builder"}
          </button>
          {!readOnly && (
            <>
              <button
                className={adminSecondary}
                disabled={busy || loading}
                onClick={() => void persist(false)}
                type="button"
              >
                {busy ? "Đang lưu…" : "Lưu bản nháp"}
              </button>
              {!legacy && (
                <button
                  className={adminPrimary}
                  disabled={busy || loading}
                  onClick={() => void persist(true)}
                  style={adminGradient}
                  type="button"
                >
                  Xuất bản đề
                </button>
              )}
            </>
          )}
        </>
      }
      badge={
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${readOnly ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"}`}
        >
          {readOnly ? "Công bố" : saved ? "Bản nháp" : "Chưa lưu"}
        </span>
      }
      eyebrow="TEST BUILDER · 2/2/3/3/1 CÂU"
      label="Soạn đề Speaking trực tiếp"
      onClose={onClose}
      title={metadata.code || "Đề Speaking mới"}
    >
      {loading || loadError ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <AdminLoadState
            error={loadError}
            loading={loading}
            onRetry={() => setAttempt((value) => value + 1)}
          />
        </div>
      ) : legacy ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
          <TestInfoPanel
            disabled={false}
            onChange={(next) =>
              setMetadata((current) => ({ ...current, ...next }))
            }
            value={metadata}
          />
          <AdminPanel
            description="Đề cũ tiếp tục dùng các bài tập đã gắn. Nội dung không được chuyển sang ngân hàng hay builder mới."
            title="Nội dung đề cũ"
          >
            <ul className="divide-y divide-[var(--admin-border)] text-sm">
              {legacyExercises.map((exercise) => (
                <li
                  className="flex items-center justify-between gap-4 py-3"
                  key={exercise.id}
                >
                  <span>
                    <b>{exercise.code}</b> · Part {exercise.part} ·{" "}
                    {exercise.topic}
                  </span>
                  <span className="text-xs font-bold text-[var(--admin-muted)]">
                    {exercise.status}
                  </span>
                </li>
              ))}
            </ul>
          </AdminPanel>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-4 xl:self-start">
            <TestInfoPanel
              disabled={Boolean(readOnly)}
              onChange={(next) => {
                setMetadata((current) => ({ ...current, ...next }));
                setErrors([]);
              }}
              value={metadata}
            />
            <PublishChecklistPanel errors={errors} items={checklist} />
            <p className="rounded-xl border border-[#ffd8cb] bg-[#fff9f6] p-3 text-xs leading-5 text-[var(--admin-muted)]">
              Nội dung ở đây chỉ thuộc đề này. Bản nháp lưu cả những nhóm đang
              soạn dở; chỉ khi xuất bản hệ thống mới yêu cầu đủ 7 nhóm / 11 câu.
            </p>
          </aside>
          <div className="space-y-6">
            {speakingParts.map((part) => (
              <section
                className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_12px_30px_rgb(73_43_31/4%)]"
                key={part}
              >
                <header className="border-b border-[var(--admin-border)] bg-[linear-gradient(100deg,#fff9f5,#fffdfc)] px-5 py-4">
                  <p className="text-[11px] font-bold tracking-[0.13em] text-[var(--admin-brand-red)]">
                    PART {part}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[var(--admin-ink)]">
                    {speakingPartSpecs[part].title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    {speakingPartSpecs[part].description}
                  </p>
                </header>
                <div className="divide-y divide-[var(--admin-border)]">
                  {questions[part].map((draft, index) => {
                    const complete = isDirectQuestionComplete(draft);
                    const label =
                      part === 3
                        ? "Nhóm câu 5–7"
                        : part === 4
                          ? "Nhóm câu 8–10"
                          : `Câu ${part === 1 ? index + 1 : part === 2 ? index + 3 : 11}`;
                    return (
                      <div
                        className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)]"
                        key={index}
                      >
                        <div>
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="font-bold text-[var(--admin-ink)]">
                              {label}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${complete ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"}`}
                            >
                              {complete ? "Đã hoàn thiện" : "Đang soạn"}
                            </span>
                          </div>
                          <SpeakingExerciseFields
                            disabled={Boolean(readOnly)}
                            draft={draft}
                            update={(key, value) =>
                              updateQuestion(part, index, (current) => ({
                                ...current,
                                [key]: value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-4 rounded-xl bg-[var(--admin-surface-muted)] p-4">
                          <label className="block text-sm font-semibold">
                            Tiêu chí chấm
                            <textarea
                              className={`${adminTextarea} mt-1.5 min-h-28 bg-white`}
                              disabled={Boolean(readOnly)}
                              onChange={(event) =>
                                updateQuestion(part, index, (current) => ({
                                  ...current,
                                  rubricNotes: event.target.value,
                                }))
                              }
                              value={draft.rubricNotes}
                            />
                          </label>
                          <label className="block text-sm font-semibold">
                            Bài mẫu / gợi ý *
                            <textarea
                              className={`${adminTextarea} mt-1.5 min-h-28 bg-white`}
                              disabled={Boolean(readOnly)}
                              onChange={(event) =>
                                updateQuestion(part, index, (current) => ({
                                  ...current,
                                  modelAnswer: event.target.value,
                                }))
                              }
                              value={draft.modelAnswer}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </AdminWorkspace>
  );
}
