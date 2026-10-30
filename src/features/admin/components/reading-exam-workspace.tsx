"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import {
  getReadingRevision,
  publishReadingRevision,
  updateReadingContexts,
  updateReadingQuestion,
  uploadReadingImage,
  uploadReadingMasterAudio,
} from "@/features/admin/exam-api";
import {
  type ReadingBlock,
  type ReadingQuestion,
  type ReadingRevision,
} from "@/features/admin/exam-management";
import { ExamIcon } from "./exam-icon";

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
  };
}

function hasQuestionContent(question: ReadingQuestion) {
  return Boolean(
    question.code &&
    question.stem &&
    question.optionA &&
    question.optionB &&
    question.optionC &&
    question.optionD &&
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
  const [selectedNumber, setSelectedNumber] = useState(101);
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

  const requestKey = `${examId}:${revisionId}:${retry}`;
  const loading = completedRequestKey !== requestKey;
  const error = loadError?.key === requestKey ? loadError.message : null;

  useEffect(() => {
    let active = true;
    getReadingRevision(examId, revisionId)
      .then((loaded) => {
        if (!active) return;
        setRevision(loaded);
        const firstReadingQuestion = loaded.blocks
          .filter((block) => block.part >= 5)
          .flatMap((block) => block.questions)
          .find(Boolean);
        if (firstReadingQuestion) {
          setSelectedNumber(firstReadingQuestion.number);
          setDraft(toDraft(firstReadingQuestion));
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
            reason instanceof Error
              ? reason.message
              : "Không thể tải bản nháp.",
        });
      })
      .finally(() => {
        if (active) setCompletedRequestKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [examId, requestKey, revisionId]);

  const readingBlocks =
    revision?.blocks.filter((block) => block.part >= 5) ?? [];
  const selected = (() => {
    for (const block of readingBlocks) {
      const question = block.questions.find(
        (item) => item.number === selectedNumber,
      );
      if (question) return { block, question };
    }
    return null;
  })();

  function selectQuestion(number: number) {
    setSelectedNumber(number);
    const question = readingBlocks
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
        },
      );
      setNotice(`Đã lưu câu ${selected.question.number}.`);
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Không thể lưu câu hỏi.",
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
      setNotice("Đã lưu nội dung chung của cụm câu hỏi.");
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Không thể lưu ngữ cảnh.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !draft) return;
    setSaving(true);
    setNotice(null);
    try {
      const asset = await uploadReadingImage(file);
      setDraft({ ...draft, imageAssetId: asset.id });
      setNotice("Đã tải ảnh lên. Nhấn “Lưu câu hỏi” để gắn ảnh vào đề.");
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Không thể tải ảnh lên.",
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  async function chooseMasterAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setNotice(null);
    try {
      await uploadReadingMasterAudio(examId, revisionId, file);
      setNotice("Đã cập nhật master audio cho đề L&R.");
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Không thể tải master audio lên.",
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
      setNotice("Đề đã được xuất bản.");
      setRetry((value) => value + 1);
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Đề chưa đáp ứng điều kiện xuất bản.",
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
        <p className="font-bold">Không thể mở bản nháp Reading</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          className="mt-4 rounded-lg border border-current px-3 py-2 text-sm font-bold"
          onClick={() => setRetry((value) => value + 1)}
          type="button"
        >
          Thử lại
        </button>
      </div>
    );

  const completeCount = readingBlocks
    .flatMap((block) => block.questions)
    .filter(hasQuestionContent).length;
  const totalReading = readingBlocks.reduce(
    (total, block) => total + block.questions.length,
    0,
  );
  const isPublished = revision.status === "Published";

  return (
    <div className="mx-auto max-w-[1560px]">
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--admin-muted)] transition hover:text-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
        href="/admin/exams"
      >
        <ExamIcon className="size-4" name="arrow-left" />
        Quay lại kho đề
      </Link>
      <header className="mt-5 rounded-2xl border border-[var(--admin-border)] bg-[linear-gradient(110deg,#fffdfc,#fff5ee)] p-5 shadow-[0_15px_36px_rgb(73_43_31/4%)] lg:flex lg:items-center lg:justify-between lg:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
              READING · PART 5–7
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${isPublished ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"}`}
            >
              {isPublished ? "Đã xuất bản" : "Bản nháp"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[var(--admin-ink)]">
            {revision.code}
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {revision.title} · Revision {revision.versionNumber} · quản lý riêng
            100 câu Reading trong đề L&R.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">
          <button
            className="h-10 rounded-lg border border-[var(--admin-border)] bg-white px-4 text-sm font-bold text-[var(--admin-ink-soft)] disabled:opacity-50"
            disabled={isPublished || saving}
            onClick={() => void saveQuestion()}
            type="button"
          >
            {saving ? "Đang lưu..." : "Lưu câu hỏi"}
          </button>
          <button
            className="admin-primary-action h-10 rounded-lg px-4 text-sm font-bold"
            disabled={isPublished || publishing || !revision.hasMasterAudio}
            onClick={() => void publish()}
            title={
              revision.hasMasterAudio
                ? undefined
                : "Tải master audio trước khi xuất bản đề L&R."
            }
            type="button"
          >
            {publishing ? "Đang xuất bản..." : "Xuất bản đề"}
          </button>
        </div>
      </header>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <main className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.12em] text-[var(--admin-brand-red)]">
                  TIẾN ĐỘ READING
                </p>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {completeCount}/{totalReading} câu Part 5–7 có nội dung và đáp
                  án đầy đủ.
                </p>
              </div>
              <strong className="text-xl text-[var(--admin-ink)]">
                {totalReading === 0
                  ? 0
                  : Math.round((completeCount / totalReading) * 100)}
                %
              </strong>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]">
              <div
                className="admin-brand-gradient-fill h-full rounded-full"
                style={{
                  width: `${totalReading === 0 ? 0 : (completeCount / totalReading) * 100}%`,
                }}
              />
            </div>
            <p className="mt-3 rounded-lg bg-[var(--admin-warning-soft)] px-3 py-2 text-xs leading-5 text-[var(--admin-warning)]">
              Backend hiện xuất bản toàn bộ đề Listening & Reading. Reading hoàn
              thiện vẫn cần phần Listening hợp lệ trước khi publish thành công.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--admin-border)] bg-white p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]">
                  <ExamIcon className="size-5" name="upload" />
                </span>
                <span>
                  <strong className="block text-sm text-[var(--admin-ink)]">
                    Master audio L&R
                  </strong>
                  <small className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                    {revision.hasMasterAudio
                      ? "Đã có file audio. Có thể thay thế khi đề còn Draft."
                      : "Bắt buộc trước khi publish. Chấp nhận MP3/WAV, tối đa 100 MiB."}
                  </small>
                </span>
              </div>
              <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-[var(--admin-border)] bg-white px-3 text-xs font-bold text-[var(--admin-ink-soft)] transition hover:border-[var(--admin-brand-orange)] disabled:cursor-not-allowed disabled:opacity-50">
                {saving
                  ? "Đang tải..."
                  : revision.hasMasterAudio
                    ? "Thay audio"
                    : "Tải audio"}
                <input
                  accept="audio/mpeg,audio/wav,.mp3,.wav"
                  className="sr-only"
                  disabled={isPublished || saving}
                  onChange={chooseMasterAudio}
                  type="file"
                />
              </label>
            </div>
          </section>
          {notice && (
            <output
              aria-live="polite"
              className={`block rounded-xl p-3 text-sm ${notice.startsWith("Đã") ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]"}`}
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
              onSaveContexts={() => void saveContexts()}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--admin-border)] p-10 text-center text-sm text-[var(--admin-muted)]">
              Revision chưa có câu Reading để chỉnh sửa.
            </div>
          )}
        </main>
        <QuestionMatrix
          blocks={readingBlocks}
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
              Câu {question.number}
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Block {block.key} · câu đầu {block.firstQuestionNumber}
            </p>
          </div>
          {hasQuestionContent(question) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-success-soft)] px-2.5 py-1 text-xs font-bold text-[var(--admin-success)]">
              <ExamIcon className="size-3.5" name="check" />
              Đã hoàn thiện
            </span>
          ) : (
            <span className="rounded-full bg-[var(--admin-warning-soft)] px-2.5 py-1 text-xs font-bold text-[var(--admin-warning)]">
              Cần hoàn thiện
            </span>
          )}
        </div>
      </header>
      {contexts.length > 0 && (
        <section className="border-b border-[var(--admin-border)] bg-[#fffaf7] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--admin-ink)]">
                Nội dung chung của cụm câu hỏi
              </p>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Áp dụng cho Part 6/7; sửa tại đây sẽ cập nhật cả block.
              </p>
            </div>
            <button
              className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--admin-ink-soft)] disabled:opacity-50"
              disabled={disabled}
              onClick={onSaveContexts}
              type="button"
            >
              Lưu nội dung chung
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
                    ? `Đoạn văn ${context.ordinal}`
                    : `Ảnh ngữ cảnh ${context.ordinal}`}
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
                </label>
              );
            })}
          </div>
        </section>
      )}
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {field("code", "Mã câu hỏi")}
        {field("stem", "Nội dung câu hỏi", true)}
        <div className="lg:col-span-2 grid gap-3 md:grid-cols-2">
          {(["optionA", "optionB", "optionC", "optionD"] as const).map(
            (name, index) => (
              <div
                className={`rounded-xl border p-3 text-sm font-bold ${draft.correctKey === "ABCD"[index] ? "border-[var(--admin-brand-orange)] bg-[var(--admin-nav-active)]" : "border-[var(--admin-border)]"}`}
                key={name}
              >
                <span className="flex items-center justify-between">
                  <span>Đáp án {"ABCD"[index]}</span>
                  <input
                    aria-label={`Chọn đáp án ${"ABCD"[index]} là đáp án đúng`}
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
                  aria-label={`Nội dung đáp án ${"ABCD"[index]}`}
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
        {field("translation", "Dịch nghĩa", true)}
        {field("explanation", "Giải thích đáp án", true)}
        <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--admin-brand-orange)]/50 bg-[var(--admin-nav-active)]/40 p-4 text-sm font-bold text-[var(--admin-ink)]">
          <span className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white text-[var(--admin-brand-red)]">
              <ExamIcon className="size-5" name="image" />
            </span>
            <span>
              <span className="block">Ảnh minh họa</span>
              <small className="mt-0.5 block font-medium text-[var(--admin-muted)]">
                {draft.imageAssetId
                  ? `Asset ${draft.imageAssetId}`
                  : "PNG/JPEG/WebP tối đa 5 MiB"}
              </small>
            </span>
          </span>
          <input
            accept="image/png,image/jpeg,image/webp"
            aria-label="Tải ảnh minh họa"
            className="max-w-[220px] text-xs font-medium"
            disabled={disabled}
            onChange={onImage}
            type="file"
          />
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
    <aside className="h-fit rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 xl:sticky xl:top-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[var(--admin-ink)]">Ma trận Reading</h2>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            100 câu · Part 5–7
          </p>
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]">
          <ExamIcon className="size-5" name="spark" />
        </span>
      </div>
      <div className="mt-4 space-y-4">
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
            <div className="grid grid-cols-6 gap-1.5">
              {block.questions.map((question) => (
                <button
                  aria-label={`Mở câu ${question.number}`}
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
