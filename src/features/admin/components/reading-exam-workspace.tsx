"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { readAudioDurationMs } from "@/features/admin/audio-metadata";
import {
  completeMediaUploadIntent,
  createMediaUploadIntent,
  getReadingRevision,
  getScoreProfiles,
  updateReadingScoreProfile,
  forkReadingRevision,
  type ReadingDraft,
  publishReadingRevision,
  updateReadingContexts,
  updateReadingQuestion,
  uploadFileToMediaIntent,
} from "@/features/admin/exam-api";
import {
  type ReadingBlock,
  type ReadingQuestion,
  type ReadingRevision,
  type ScoreProfile,
} from "@/features/admin/exam-management";
import { formatClock, formatPhase } from "@/shared/ui/format-time";
import { ExamIcon } from "./exam-icon";
import { CreateScoreProfileButton } from "./create-score-profile-button";

interface QuestionDraft {
  code: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctKey: "A" | "B" | "C" | "D";
  translation: string;
  explanation: string;
  imageAssetId: string | null;
  imageRequired: boolean;
}

function toDraft(question: ReadingQuestion): QuestionDraft {
  return {
    code: question.code ?? "",
    stem: question.stem ?? "",
    optionA: question.optionA ?? "",
    optionB: question.optionB ?? "",
    optionC: question.optionC ?? "",
    optionD: question.optionD ?? "",
    correctKey:
      question.correctKey === "A" ||
      question.correctKey === "B" ||
      question.correctKey === "C" ||
      question.correctKey === "D"
        ? question.correctKey
        : "A",
    translation: question.translation ?? "",
    explanation: question.explanation ?? "",
    imageAssetId: question.imageAssetId,
    imageRequired: question.imageRequired,
  };
}

function hasQuestionContent(question: ReadingQuestion) {
  return Boolean(
    question.code &&
    question.stem &&
    question.optionA &&
    question.optionB &&
    question.optionC &&
    (question.optionD || (question.number >= 7 && question.number <= 31)) &&
    question.correctKey,
  );
}

export function ReadingExamWorkspace({
  examId,
  revisionId,
}: {
  examId: string;
  revisionId: string;
}) {
  const [revision, setRevision] = useState<ReadingRevision | null>(null);
  const [selectedNumber, setSelectedNumber] = useState(1);
  const [draft, setDraft] = useState<QuestionDraft | null>(null);
  const [contextDrafts, setContextDrafts] = useState<
    Record<string, ReadingBlock["contextBlocks"]>
  >({});
  const [retry, setRetry] = useState(0);
  const [completedRequestKey, setCompletedRequestKey] = useState("");
  const [loadError, setLoadError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [profiles, setProfiles] = useState<ScoreProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [newDraft, setNewDraft] = useState<ReadingDraft>();
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getScoreProfiles(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setProfiles(value);
          setProfileError("");
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setProfileError(
            cause instanceof Error
              ? cause.message
              : "Unable to load score profiles.",
          );
      });
    return () => controller.abort();
  }, [retry]);

  async function applyScoreProfile() {
    if (!revision || revision.status !== "Draft" || !selectedProfile || saving)
      return;
    setSaving(true);
    setNotice(null);
    try {
      await updateReadingScoreProfile(examId, revisionId, selectedProfile);
      setRevision({ ...revision, scoreProfileId: selectedProfile });
      setNotice("Saved score profile.");
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Unable to change score profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function forkRevision() {
    if (!revision || revision.status !== "Published" || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      setNewDraft(await forkReadingRevision(examId, revisionId));
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "Unable to create draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  const requestKey = `${examId}:${revisionId}:${retry}`;
  const loading = completedRequestKey !== requestKey;
  const error = loadError?.key === requestKey ? loadError.message : null;

  useEffect(() => {
    let active = true;
    getReadingRevision(examId, revisionId)
      .then((loaded) => {
        if (!active) return;
        setRevision(loaded);
        setSelectedProfile("");
        setNewDraft(undefined);
        setNotice(null);
        const firstExamQuestion = loaded.blocks
          .flatMap((block) => block.questions)
          .find(Boolean);
        if (firstExamQuestion) {
          setSelectedNumber(firstExamQuestion.number);
          setDraft(toDraft(firstExamQuestion));
        }
        setContextDrafts(
          Object.fromEntries(
            loaded.blocks.map((block) => [
              block.key,
              block.contextBlocks.map((context) => ({ ...context })),
            ]),
          ),
        );
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setLoadError({
          key: requestKey,
          message:
            reason instanceof Error ? reason.message : "Unable to load draft.",
        });
      })
      .finally(() => {
        if (active) setCompletedRequestKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [examId, requestKey, revisionId]);

  const examBlocks = revision?.blocks ?? [];
  const selected = (() => {
    for (const block of examBlocks) {
      const question = block.questions.find(
        (item) => item.number === selectedNumber,
      );
      if (question) return { block, question };
    }
    return null;
  })();

  function selectQuestion(number: number) {
    setSelectedNumber(number);
    const question = examBlocks
      .flatMap((block) => block.questions)
      .find((item) => item.number === number);
    if (question) setDraft(toDraft(question));
  }

  async function saveQuestion() {
    if (!selected || !draft) return;
    setSaving(true);
    setNotice(null);
    try {
      await updateReadingQuestion(
        examId,
        revisionId,
        selected.question.number,
        {
          code: draft.code.trim(),
          stem: draft.stem.trim(),
          optionA: draft.optionA.trim(),
          optionB: draft.optionB.trim(),
          optionC: draft.optionC.trim(),
          optionD: draft.optionD.trim() || null,
          correctKey: draft.correctKey,
          translation: draft.translation.trim() || null,
          explanation: draft.explanation.trim() || null,
          imageAssetId: draft.imageAssetId,
          imageRequired: draft.imageRequired,
        },
      );
      setNotice(`Saved question ${selected.question.number}.`);
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Unable to save question.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveContexts() {
    if (!selected) return;
    const contexts = contextDrafts[selected.block.key] ?? [];
    setSaving(true);
    setNotice(null);
    try {
      await updateReadingContexts(examId, revisionId, selected.block.key, {
        contexts,
      });
      setNotice("Saved shared context for this question group.");
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Unable to save context.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !draft || !selected) return;
    setSaving(true);
    setNotice(null);
    try {
      const asset = await uploadWorkspaceMedia(
        "QuestionImage",
        String(selected.question.number),
        file,
      );
      setDraft({ ...draft, imageAssetId: asset.id });
      setNotice(
        'Uploaded image. Click "Save question" to attach it to the test.',
      );
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Unable to upload image.",
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  async function uploadWorkspaceMedia(
    ownerKind: "AudioGroup" | "QuestionImage" | "ContextImage",
    ownerKey: string,
    file: File,
    durationMs?: number | null,
  ) {
    const intent = await createMediaUploadIntent(examId, revisionId, {
      ownerKind,
      ownerKey,
      contentType: file.type,
      byteSize: file.size,
      ...(durationMs !== undefined ? { durationMs } : {}),
    });
    await uploadFileToMediaIntent(intent, file);
    return completeMediaUploadIntent(examId, revisionId, intent.intentId);
  }

  async function chooseAudioGroup(
    blockKey: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setNotice(null);
    try {
      const durationMs = await readAudioDurationMs(file);
      await uploadWorkspaceMedia("AudioGroup", blockKey, file, durationMs);
      setNotice("Finished uploading audio for Listening group.");
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Unable to upload audio.",
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  async function chooseContextImage(
    blockKey: string,
    ordinal: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setNotice(null);
    try {
      const asset = await uploadWorkspaceMedia(
        "ContextImage",
        `${blockKey}:${ordinal}`,
        file,
      );
      setContextDrafts((current) => ({
        ...current,
        [blockKey]: (current[blockKey] ?? []).map((context) =>
          context.ordinal === ordinal
            ? { ...context, imageAssetId: asset.id }
            : context,
        ),
      }));
      setNotice("Finished uploading context image.");
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Unable to upload image.",
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  async function publish() {
    setPublishing(true);
    setNotice(null);
    try {
      await publishReadingRevision(examId, revisionId);
      setNotice("Test has been published.");
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Test does not meet publishing requirements yet.",
      );
    } finally {
      setPublishing(false);
    }
  }

  if (loading)
    return (
      <div
        aria-busy="true"
        className="h-[620px] animate-pulse rounded-2xl bg-[var(--admin-skeleton)]"
      />
    );
  if (error || !revision)
    return (
      <div
        className="rounded-2xl border border-[var(--admin-danger)]/20 bg-[var(--admin-danger-soft)] p-6 text-[var(--admin-danger)]"
        role="alert"
      >
        <p className="font-bold">Unable to open Reading draft</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          className="mt-4 rounded-lg border border-current px-3 py-2 text-sm font-bold"
          onClick={() => setRetry((value) => value + 1)}
          type="button"
        >
          Try again
        </button>
      </div>
    );

  const completeCount = examBlocks
    .flatMap((block) => block.questions)
    .filter(hasQuestionContent).length;
  const totalQuestions = examBlocks.reduce(
    (total, block) => total + block.questions.length,
    0,
  );
  const isPublished = revision.status !== "Draft";
  const listeningBlocks = revision.blocks.filter(
    (block) => block.part >= 1 && block.part <= 4,
  );
  const totalListeningSeconds = Math.round(
    listeningBlocks.reduce(
      (sum, block) => sum + (block.audioDurationMs ?? 0),
      0,
    ) / 1000,
  );
  const mediaReady =
    listeningBlocks.every((block) => block.audioAssetId) &&
    revision.blocks.every(
      (block) =>
        block.questions.every(
          (question) => !question.imageRequired || question.imageAssetId,
        ) &&
        block.contextBlocks.every(
          (context) => !context.imageRequired || context.imageAssetId,
        ),
    );

  return (
    <div className="w-full">
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--admin-muted)] transition hover:text-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
        href="/admin/exams"
      >
        <ExamIcon className="size-4" name="arrow-left" />
        Back to test bank
      </Link>
      <header className="mt-4 border-b border-[var(--admin-border)] bg-white px-5 py-4 lg:flex lg:items-center lg:justify-between lg:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
              EXAM BUILDER · LISTENING & READING
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${isPublished ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"}`}
            >
              {revision.status}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[var(--admin-ink)]">
            {revision.code}
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {revision.title} · Revision {revision.versionNumber} · manage 200
            questions and media for the L&R test.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">
          {revision.status === "Published" && (
            <button
              type="button"
              disabled={saving || !!newDraft}
              className="h-10 rounded-lg border px-4 text-sm font-bold"
              onClick={() => void forkRevision()}
            >
              Create new draft
            </button>
          )}
          {newDraft && (
            <Link
              className="h-10 rounded-lg border px-4 py-2 text-sm font-bold"
              href={`/admin/exams/reading/${encodeURIComponent(newDraft.examId)}/${encodeURIComponent(newDraft.revisionId)}`}
            >
              Open new draft
            </Link>
          )}
          <button
            className="h-10 rounded-lg border border-[var(--admin-border)] bg-white px-4 text-sm font-bold text-[var(--admin-ink-soft)] disabled:opacity-50"
            disabled={isPublished || saving}
            onClick={() => void saveQuestion()}
            type="button"
          >
            {saving ? "Saving..." : "Save question"}
          </button>
          <button
            className="admin-primary-action h-10 rounded-lg px-4 text-sm font-bold"
            disabled={isPublished || publishing || !mediaReady}
            onClick={() => void publish()}
            title={
              mediaReady
                ? undefined
                : "Upload all Listening audio and required images before publishing the L&R test."
            }
            type="button"
          >
            {publishing ? "Publishing..." : "Publish test"}
          </button>
        </div>
      </header>
      <section
        aria-label="Exam score profile"
        className="flex flex-wrap items-center gap-3 border border-(--admin-border) bg-white p-4"
      >
        <label className="text-sm font-semibold">
          Score profile{" "}
          <select
            className="ml-2 rounded-lg border p-2"
            disabled={isPublished || saving}
            value={selectedProfile || revision.scoreProfileId}
            onChange={(event) => setSelectedProfile(event.target.value)}
          >
            {!profiles.some(
              (profile) => profile.id === revision.scoreProfileId,
            ) && (
              <option value={revision.scoreProfileId}>Current profile</option>
            )}
            {profiles.map((profile) => (
              <option value={profile.id} key={profile.id}>
                {profile.name}
                {profile.isComplete ? "" : " (incomplete)"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm font-semibold"
          disabled={
            isPublished ||
            saving ||
            !selectedProfile ||
            selectedProfile === revision.scoreProfileId
          }
          onClick={() => void applyScoreProfile()}
        >
          Apply score profile
        </button>
        <CreateScoreProfileButton
          onCreated={(profile) => {
            setProfiles((previous) => [...previous, profile]);
            setSelectedProfile(profile.id);
          }}
        />
        {profileError && (
          <p role="alert">
            {profileError}{" "}
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Reload profiles
            </button>
          </p>
        )}
      </section>
      <div className="grid gap-0 border border-t-0 border-[var(--admin-border)] bg-white xl:grid-cols-[minmax(0,1fr)_330px]">
        <main
          className="min-w-0 space-y-4 bg-[#f8fafc] p-5"
          id="main-content"
          tabIndex={-1}
        >
          <section className="rounded-lg border border-[var(--admin-border)] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.12em] text-[var(--admin-brand-red)]">
                  AUTHORING PROGRESS
                </p>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {completeCount}/{totalQuestions} questions have complete
                  content and answers.
                </p>
              </div>
              <strong className="text-xl text-[var(--admin-ink)]">
                {totalQuestions === 0
                  ? 0
                  : Math.round((completeCount / totalQuestions) * 100)}
                %
              </strong>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]">
              <div
                className="admin-brand-gradient-fill h-full rounded-full"
                style={{
                  width: `${totalQuestions === 0 ? 0 : (completeCount / totalQuestions) * 100}%`,
                }}
              />
            </div>
            <p className="mt-3 rounded-lg bg-[var(--admin-warning-soft)] px-3 py-2 text-xs leading-5 text-[var(--admin-warning)]">
              Publishing is only available when all questions, score profile,
              and required media for the L&R test are valid.
            </p>
            {listeningBlocks.length > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[var(--admin-ink)]">
                    Listening Media
                  </p>
                  <p className="text-xs font-semibold text-[var(--admin-muted)]">
                    Total Listening duration:{" "}
                    {formatPhase(totalListeningSeconds)}
                  </p>
                </div>
                {listeningBlocks.map((block) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--admin-border)] bg-white p-3"
                    key={block.key}
                  >
                    <span className="text-sm text-[var(--admin-ink-soft)]">
                      Part {block.part} · questions {block.questions[0]?.number}
                      –{block.questions.at(-1)?.number}
                      {block.audioAssetId
                        ? ` · MP3 uploaded${block.audioDurationMs !== null ? ` (${formatClock(block.audioDurationMs / 1000)})` : ""}`
                        : " · No MP3 yet"}
                    </span>
                    <label className="cursor-pointer rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs font-bold disabled:opacity-50">
                      {block.audioAssetId ? "Replace audio" : "Upload audio"}
                      <input
                        accept="audio/mpeg,audio/wav,.mp3,.wav"
                        className="sr-only"
                        disabled={isPublished || saving}
                        onChange={(event) =>
                          void chooseAudioGroup(block.key, event)
                        }
                        type="file"
                      />
                    </label>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
          {notice && (
            <output
              aria-live="polite"
              className={`block rounded-xl p-3 text-sm ${notice.startsWith("Saved") || notice.startsWith("Uploaded") || notice.startsWith("Finished") || notice.startsWith("Test has been") ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]"}`}
            >
              {notice}
            </output>
          )}
          {selected && draft ? (
            <QuestionEditor
              block={selected.block}
              contextDrafts={contextDrafts}
              draft={draft}
              disabled={isPublished || saving}
              question={selected.question}
              onChange={setDraft}
              onContextChange={(contexts) =>
                setContextDrafts({
                  ...contextDrafts,
                  [selected.block.key]: contexts,
                })
              }
              onImage={chooseImage}
              onContextImage={chooseContextImage}
              onSaveContexts={() => void saveContexts()}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--admin-border)] p-10 text-center text-sm text-[var(--admin-muted)]">
              This revision has no questions to edit yet.
            </div>
          )}
        </main>
        <QuestionMatrix
          blocks={examBlocks}
          selectedNumber={selectedNumber}
          onSelect={selectQuestion}
        />
      </div>
    </div>
  );
}

function QuestionEditor({
  block,
  contextDrafts,
  draft,
  disabled,
  question,
  onChange,
  onContextChange,
  onImage,
  onContextImage,
  onSaveContexts,
}: {
  block: ReadingBlock;
  contextDrafts: Record<string, ReadingBlock["contextBlocks"]>;
  draft: QuestionDraft;
  disabled: boolean;
  question: ReadingQuestion;
  onChange: (draft: QuestionDraft) => void;
  onContextChange: (contexts: ReadingBlock["contextBlocks"]) => void;
  onImage: (event: ChangeEvent<HTMLInputElement>) => void;
  onContextImage: (
    blockKey: string,
    ordinal: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onSaveContexts: () => void;
}) {
  const contexts = contextDrafts[block.key] ?? [];
  const field = (
    name: keyof QuestionDraft,
    label: string,
    multiline = false,
  ) => {
    const inputId = `question-${question.number}-${name}`;
    return (
      <label
        className="block text-sm font-bold text-[var(--admin-ink)]"
        htmlFor={inputId}
      >
        <span>{label}</span>
        {multiline ? (
          <textarea
            className="mt-1.5 w-full rounded-lg border border-[var(--admin-border)] bg-white p-3 font-medium leading-6 outline-none focus:border-[var(--admin-brand-orange)] disabled:bg-stone-50"
            disabled={disabled}
            id={inputId}
            onChange={(event) =>
              onChange({ ...draft, [name]: event.target.value })
            }
            rows={name === "stem" ? 4 : 3}
            value={draft[name] as string}
          />
        ) : (
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 font-medium outline-none focus:border-[var(--admin-brand-orange)] disabled:bg-stone-50"
            disabled={disabled}
            id={inputId}
            onChange={(event) =>
              onChange({ ...draft, [name]: event.target.value })
            }
            value={draft[name] as string}
          />
        )}
      </label>
    );
  };
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <header className="border-b border-[var(--admin-border)] bg-[linear-gradient(100deg,#fff9f5,#fffdfc)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-[var(--admin-brand-red)]">{`PART ${block.part} · ${block.type}`}</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--admin-ink)]">
              Question {question.number}
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Block {block.key} · first question {block.firstQuestionNumber}
            </p>
          </div>
          {hasQuestionContent(question) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-success-soft)] px-2.5 py-1 text-xs font-bold text-[var(--admin-success)]">
              <ExamIcon className="size-3.5" name="check" />
              Complete
            </span>
          ) : (
            <span className="rounded-full bg-[var(--admin-warning-soft)] px-2.5 py-1 text-xs font-bold text-[var(--admin-warning)]">
              Incomplete
            </span>
          )}
        </div>
      </header>
      {contexts.length > 0 && (
        <section className="border-b border-[var(--admin-border)] bg-[#fffaf7] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--admin-ink)]">
                Shared context for question group
              </p>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Applies to Part 6/7; editing here updates the entire block.
              </p>
            </div>
            <button
              className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--admin-ink-soft)] disabled:opacity-50"
              disabled={disabled}
              onClick={onSaveContexts}
              type="button"
            >
              Save shared context
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {contexts.map((context, index) => {
              const contextId = `context-${block.key}-${context.ordinal}`;
              return (
                <label
                  className="block text-sm font-bold text-[var(--admin-ink)]"
                  htmlFor={contextId}
                  key={context.ordinal}
                >
                  {context.type === "Text"
                    ? `Passage ${context.ordinal}`
                    : `Context image ${context.ordinal}`}
                  <textarea
                    className="mt-1.5 w-full rounded-lg border border-[var(--admin-border)] bg-white p-3 font-medium leading-6 outline-none focus:border-[var(--admin-brand-orange)] disabled:bg-stone-50"
                    disabled={disabled || context.type !== "Text"}
                    id={contextId}
                    onChange={(event) =>
                      onContextChange(
                        contexts.map((item, contextIndex) =>
                          contextIndex === index
                            ? { ...item, text: event.target.value }
                            : item,
                        ),
                      )
                    }
                    rows={5}
                    value={context.text ?? ""}
                  />
                  {context.type === "Image" && context.imageRequired && (
                    <span className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-dashed border-[var(--admin-brand-orange)]/50 p-2 text-xs">
                      <span>
                        {context.imageAssetId
                          ? `Asset ${context.imageAssetId}`
                          : "Image upload required before publishing"}
                      </span>
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        aria-label={`Upload context image ${context.ordinal}`}
                        disabled={disabled}
                        onChange={(event) =>
                          onContextImage(block.key, context.ordinal, event)
                        }
                        type="file"
                      />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </section>
      )}
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {field("code", "Question code")}
        {field("stem", "Question stem", true)}
        <div className="lg:col-span-2 grid gap-3 md:grid-cols-2">
          {(["optionA", "optionB", "optionC", "optionD"] as const).map(
            (name, index) => (
              <div
                className={`rounded-xl border p-3 text-sm font-bold ${draft.correctKey === "ABCD"[index] ? "border-[var(--admin-brand-orange)] bg-[var(--admin-nav-active)]" : "border-[var(--admin-border)]"}`}
                key={name}
              >
                <span className="flex items-center justify-between">
                  <span>Option {"ABCD"[index]}</span>
                  <input
                    aria-label={`Select Option ${"ABCD"[index]} as correct answer`}
                    checked={draft.correctKey === "ABCD"[index]}
                    disabled={disabled}
                    name={`correct-${question.number}`}
                    onChange={() =>
                      onChange({
                        ...draft,
                        correctKey: "ABCD"[
                          index
                        ] as QuestionDraft["correctKey"],
                      })
                    }
                    type="radio"
                  />
                </span>
                <input
                  aria-label={`Option ${"ABCD"[index]} text`}
                  className="mt-2 h-10 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 font-medium outline-none focus:border-[var(--admin-brand-orange)] disabled:bg-stone-50"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({ ...draft, [name]: event.target.value })
                  }
                  value={draft[name]}
                />
              </div>
            ),
          )}
        </div>
        {field("translation", "Translation", true)}
        {field("explanation", "Answer explanation", true)}
        <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--admin-brand-orange)]/50 bg-[var(--admin-nav-active)]/40 p-4 text-sm font-bold text-[var(--admin-ink)]">
          <span className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white text-[var(--admin-brand-red)]">
              <ExamIcon className="size-5" name="image" />
            </span>
            <span>
              <span className="block">Illustration image</span>
              <small className="mt-0.5 block font-medium text-[var(--admin-muted)]">
                {draft.imageAssetId
                  ? `Asset ${draft.imageAssetId}`
                  : "PNG/JPEG/WebP max 5 MiB"}
              </small>
            </span>
          </span>
          <input
            accept="image/png,image/jpeg,image/webp"
            aria-label="Upload illustration image"
            className="max-w-[220px] text-xs font-medium"
            disabled={disabled}
            onChange={onImage}
            type="file"
          />
          <label className="flex items-center gap-2 text-xs font-medium">
            <input
              checked={draft.imageRequired}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...draft, imageRequired: event.target.checked })
              }
              type="checkbox"
            />
            Require image before publishing
          </label>
        </div>
      </div>
    </section>
  );
}

function QuestionMatrix({
  blocks,
  selectedNumber,
  onSelect,
}: {
  blocks: ReadingBlock[];
  selectedNumber: number;
  onSelect: (number: number) => void;
}) {
  return (
    <aside className="h-full border-l border-[var(--admin-border)] bg-white p-4 xl:sticky xl:top-[55px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[var(--admin-ink)]">
            200-Question Matrix
          </h2>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            Listening 1–100 · Reading 101–200
          </p>
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]">
          <ExamIcon className="size-5" name="spark" />
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {blocks.map((block) => (
          <section key={block.key}>
            <div className="mb-2 flex items-center justify-between text-xs">
              <strong className="text-[var(--admin-ink)]">
                Part {block.part}
              </strong>
              <span className="text-[var(--admin-muted)]">
                {block.questions[0]?.number}–{block.questions.at(-1)?.number}
              </span>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {block.questions.map((question) => (
                <button
                  aria-label={`Open question ${question.number}`}
                  className={`grid aspect-square place-items-center rounded-md text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)] ${question.number === selectedNumber ? "admin-brand-gradient-fill text-white shadow-sm" : hasQuestionContent(question) ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)] hover:brightness-95" : "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)] hover:bg-[var(--admin-nav-active)]"}`}
                  key={question.number}
                  onClick={() => onSelect(question.number)}
                  type="button"
                >
                  {question.number}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
