"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminGradient,
  adminPrimary,
  adminSecondary,
  adminTextarea,
} from "@/features/admin/components/content/admin-styles";
import { AdminPanel } from "@/features/admin/components/content/admin-workspace";
import {
  createSpeakingTest,
  cloneSpeakingTest,
  deleteSpeakingTest,
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
  type SpeakingTestContentMode,
} from "@/features/speaking/types";
import { AdminLoadState, errorMessage } from "./admin-load-state";
import { PublishChecklistPanel } from "./publish-checklist-panel";
import { SpeakingWorkspaceDialog } from "./speaking-workspace-dialog";
import { SpeakingExerciseFields } from "./speaking-exercise-fields";
import { TestInfoPanel } from "./test-info-panel";
import { ExercisePickerPanel } from "./exercise-picker-panel";
import { slotLabels } from "./test-slot-picker";
import { SpeakingPrompt } from "../prompts/speaking-prompt";

type TestMetadata = Pick<SpeakingTest, "code" | "title" | "description">;
type DirectQuestionDrafts = Record<SpeakingPart, SpeakingDraft[]>;

const emptyMetadata: TestMetadata = { code: "", title: "", description: "" };

function blankQuestion(part: SpeakingPart): SpeakingDraft {
  return {
    ...toSpeakingDraft(undefined, part),
    code: "DIRECT",
    topic: "Test content",
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
  if (
    cause instanceof SpeakingApiError &&
    Object.keys(cause.fieldErrors).length > 0
  )
    return Object.values(cause.fieldErrors).flat();
  return [errorMessage(cause, "Unable to save Speaking test.")];
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
  const [contentMode, setContentMode] =
    useState<SpeakingTestContentMode>("DIRECT");
  const [exerciseIds, setExerciseIds] = useState<SpeakingTest["exerciseIds"]>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  });
  const [picker, setPicker] = useState<{
    part: SpeakingPart;
    index: number;
  } | null>(null);
  const [savedSignature, setSavedSignature] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Unable to save");
  const [conflicted, setConflicted] = useState(false);
  const [latest, setLatest] = useState<SpeakingTest | null>(null);
  const [cloneCode, setCloneCode] = useState("");
  const [cloneTitle, setCloneTitle] = useState("");

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
          setContentMode("DIRECT");
          const ids = { 1: [], 2: [], 3: [], 4: [], 5: [] };
          setExerciseIds(ids);
          setSavedSignature(
            JSON.stringify([emptyMetadata, emptyQuestions(), ids, "DIRECT"]),
          );
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
        setContentMode(detail.test.contentMode);
        setExerciseIds(detail.test.exerciseIds);
        setSavedSignature(
          JSON.stringify([
            {
              code: detail.test.code,
              title: detail.test.title,
              description: detail.test.description,
            },
            questionDrafts(detail.test),
            detail.test.exerciseIds,
            detail.test.contentMode,
          ]),
        );
      } catch (cause) {
        if (!controller.signal.aborted)
          setLoadError(errorMessage(cause, "Unable to load Speaking test."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [attempt, testId]);

  const legacy = contentMode === "EXERCISE_BANK";
  const readOnly = saved?.status === "PUBLISHED";
  const dirty =
    !loading &&
    savedSignature !==
      JSON.stringify([metadata, questions, exerciseIds, contentMode]);
  const close = () => {
    if (
      !busy &&
      (!dirty || window.confirm("You have unsaved changes. Close the builder?"))
    )
      onClose();
  };
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const chosen = Object.fromEntries(
    speakingParts.flatMap((part) =>
      exerciseIds[part].flatMap((id, index) =>
        id ? [[id, slotLabels[part][index]]] : [],
      ),
    ),
  );
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
      label: `Part ${part}: completed ${completed}/${expected} content groups`,
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
          exerciseIds,
        }
      : {
          ...metadata,
          contentMode: "DIRECT",
          questions: directQuestions,
        };

  const persist = async (publish: boolean) => {
    setErrorTitle(publish ? "Cannot publish yet" : "Unable to save");
    if (!metadata.code.trim() || !metadata.title.trim()) {
      setErrors(["Test code and title are required."]);
      return;
    }
    if (
      publish &&
      !legacy &&
      completedDirectQuestions.length !== expectedSlots
    ) {
      setErrors([
        "Complete all 7 content groups / 11 questions before publishing.",
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
      setSavedSignature(
        JSON.stringify([metadata, questions, exerciseIds, contentMode]),
      );
      setSavedAt(new Date().toLocaleTimeString("vi-VN"));
      if (publish)
        current = (await publishSpeakingTest(current.id, current.version)).test;
      setSaved(current);
      onSaved(
        publish ? `Published ${current.code}.` : `Saved draft ${current.code}.`,
      );
    } catch (cause) {
      setErrors(saveError(cause));
      setConflicted(
        cause instanceof SpeakingApiError && cause.code === "VERSION_CONFLICT",
      );
    } finally {
      setBusy(false);
    }
  };

  const clone = async () => {
    if (!saved || !cloneCode.trim() || !cloneTitle.trim() || busy) return;
    setBusy(true);
    setErrors([]);
    setErrorTitle("Unable to clone");
    try {
      const detail = await cloneSpeakingTest(
        saved.id,
        saved.version,
        cloneCode.trim(),
        cloneTitle.trim(),
      );
      const nextMetadata = {
        code: detail.test.code,
        title: detail.test.title,
        description: detail.test.description,
      };
      setSaved(detail.test);
      setMetadata(nextMetadata);
      setQuestions(questionDrafts(detail.test));
      setExerciseIds(detail.test.exerciseIds);
      setContentMode(detail.test.contentMode);
      setSavedSignature(
        JSON.stringify([
          nextMetadata,
          questionDrafts(detail.test),
          detail.test.exerciseIds,
          detail.test.contentMode,
        ]),
      );
      setCloneCode("");
      setCloneTitle("");
      onSaved(`Cloned as draft ${detail.test.code}.`);
    } catch (cause) {
      setErrors(saveError(cause));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!saved || !window.confirm(`Delete draft ${saved.code}?`)) return;
    setBusy(true);
    try {
      await deleteSpeakingTest(saved.id, saved.version);
      onSaved(`Deleted ${saved.code}.`);
      onClose();
    } catch (cause) {
      setErrors(saveError(cause));
      setBusy(false);
    }
  };

  return (
    <SpeakingWorkspaceDialog
      actions={
        <>
          <button
            className={adminSecondary}
            disabled={busy}
            onClick={close}
            type="button"
          >
            {readOnly ? "Close" : "Close builder"}
          </button>
          {!readOnly && (
            <>
              <button
                className={adminSecondary}
                disabled={busy || loading}
                onClick={() => void persist(false)}
                type="button"
              >
                {busy ? "Saving..." : "Save draft"}
              </button>
              {
                <button
                  className={adminPrimary}
                  disabled={busy || loading}
                  onClick={() => void persist(true)}
                  style={adminGradient}
                  type="button"
                >
                  Publish test
                </button>
              }
            </>
          )}
          {saved?.status === "DRAFT" && (
            <button
              className={adminSecondary}
              disabled={busy}
              onClick={() => void remove()}
              type="button"
            >
              Delete draft
            </button>
          )}
        </>
      }
      badge={
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${readOnly ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"}`}
        >
          {readOnly ? "Published" : saved ? "Draft" : "Unsaved"}
        </span>
      }
      eyebrow={`TEST BUILDER · 11 QUESTIONS · 7 EXERCISES${savedAt ? ` · Saved ${savedAt}` : ""}`}
      label="Direct Speaking test authoring"
      onClose={close}
      title={metadata.code || "New Speaking test"}
    >
      {!loading && !loadError && (
        <div className="mb-5 space-y-3">
          {!saved && (
            <label className="block text-sm font-semibold">
              Authoring mode{" "}
              <select
                className="ml-3 rounded-lg border p-2"
                value={contentMode}
                disabled={busy}
                onChange={(event) =>
                  setContentMode(event.target.value as SpeakingTestContentMode)
                }
              >
                <option value="DIRECT">Enter content directly</option>
                <option value="EXERCISE_BANK">Select from exercise bank</option>
              </select>
            </label>
          )}
          {errors.length > 0 && legacy && (
            <PublishChecklistPanel
              errors={errors}
              errorTitle={errorTitle}
              items={[]}
            />
          )}
          {conflicted && (
            <div role="alert">
              <button
                className={adminSecondary}
                onClick={async () => {
                  if (!saved) return;
                  try {
                    setLatest((await getSpeakingTestDetail(saved.id)).test);
                  } catch (cause) {
                    setErrors(saveError(cause));
                  }
                }}
                type="button"
              >
                Reload latest version to compare
              </button>
              <p>Your current edits are preserved.</p>
              {latest && (
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border p-3">
                  {JSON.stringify(latest, null, 2)}
                </pre>
              )}
            </div>
          )}
          {readOnly && (
            <div className="flex flex-wrap gap-3 rounded-xl border p-3">
              <label>
                New test code
                <input
                  aria-label="Clone test code"
                  className="ml-2 rounded border p-2"
                  value={cloneCode}
                  onChange={(event) => setCloneCode(event.target.value)}
                />
              </label>
              <label>
                New test title
                <input
                  aria-label="Clone test title"
                  className="ml-2 rounded border p-2"
                  value={cloneTitle}
                  onChange={(event) => setCloneTitle(event.target.value)}
                />
              </label>
              <button
                className={adminSecondary}
                disabled={busy || !cloneCode.trim() || !cloneTitle.trim()}
                onClick={() => void clone()}
                type="button"
              >
                Clone as draft
              </button>
            </div>
          )}
        </div>
      )}
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
            disabled={Boolean(readOnly) || busy}
            onChange={(next) =>
              setMetadata((current) => ({ ...current, ...next }))
            }
            value={metadata}
          />
          <AdminPanel
            description="Select an exercise for each slot. Questions 5-7 and 8-10 each use one exercise."
            title="Exercise bank content · 11 questions · 7 exercises"
          >
            <div className="space-y-4">
              {speakingParts.flatMap((part) =>
                Array.from(
                  { length: speakingPartSpecs[part].slots },
                  (_, index) => {
                    const id = exerciseIds[part][index];
                    const exercise = legacyExercises.find(
                      (item) => item.id === id,
                    );
                    return (
                      <section
                        className="rounded-xl border p-3"
                        key={`${part}-${index}`}
                      >
                        <h3 className="font-semibold">
                          {slotLabels[part][index]} · Part {part}
                        </h3>
                        <p className="my-2 text-sm">
                          {exercise
                            ? `${exercise.code} · ${exercise.topic} · ${exercise.status}`
                            : "No exercise selected"}
                        </p>
                        {!readOnly && (
                          <div className="flex gap-2">
                            <button
                              className={adminSecondary}
                              disabled={busy}
                              onClick={() => setPicker({ part, index })}
                              type="button"
                            >
                              Select exercise for {slotLabels[part][index]}
                            </button>
                            <button
                              className={adminSecondary}
                              disabled={!id || busy}
                              onClick={() =>
                                setExerciseIds((current) => {
                                  const next = [...current[part]];
                                  next[index] = "";
                                  return { ...current, [part]: next };
                                })
                              }
                              type="button"
                            >
                              Remove {slotLabels[part][index]}
                            </button>
                          </div>
                        )}
                        {picker?.part === part && picker.index === index && (
                          <ExercisePickerPanel
                            part={part}
                            selected={chosen}
                            onClose={() => setPicker(null)}
                            onPick={(item) => {
                              setLegacyExercises((current) => [
                                ...current.filter(
                                  (candidate) => candidate.id !== item.id,
                                ),
                                item,
                              ]);
                              setExerciseIds((current) => {
                                const next = [...current[part]];
                                next[index] = item.id;
                                return { ...current, [part]: next };
                              });
                              setPicker(null);
                              setErrors([]);
                            }}
                          />
                        )}
                        {exercise && (
                          <details className="mt-3">
                            <summary>Preview {slotLabels[part][index]}</summary>
                            <SpeakingPrompt
                              content={exercise}
                              showAllQuestions
                            />
                          </details>
                        )}
                      </section>
                    );
                  },
                ),
              )}
            </div>
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
            <PublishChecklistPanel
              errors={errors}
              errorTitle={errorTitle}
              items={checklist}
            />
            <p className="rounded-xl border border-[#ffd8cb] bg-[#fff9f6] p-3 text-xs leading-5 text-[var(--admin-muted)]">
              Content authored here belongs only to this test. Drafts save
              partially completed groups; all 7 groups / 11 questions are only
              required when publishing.
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
                        ? "Questions 5-7"
                        : part === 4
                          ? "Questions 8-10"
                          : `Question ${part === 1 ? index + 1 : part === 2 ? index + 3 : 11}`;
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
                              {complete ? "Complete" : "In progress"}
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
                            Rubric notes
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
                            Model answer / sample *
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
    </SpeakingWorkspaceDialog>
  );
}
