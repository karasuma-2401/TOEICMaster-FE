"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getPublishedWritingExercises,
  getWritingTest,
  publishWritingTest,
  updateWritingTest,
} from "@/features/admin/exam-api";
import type {
  WritingExercise,
  WritingTest,
} from "@/features/admin/exam-management";
import { ExamIcon } from "./exam-icon";

type WritingPart = 1 | 2 | 3;

interface ExerciseSlot {
  part: WritingPart;
  sequenceNumber: number;
}

const REQUIRED_SLOTS: ExerciseSlot[] = [
  ...Array.from({ length: 5 }, (_, index) => ({
    part: 1 as const,
    sequenceNumber: index + 1,
  })),
  ...Array.from({ length: 2 }, (_, index) => ({
    part: 2 as const,
    sequenceNumber: index + 1,
  })),
  { part: 3, sequenceNumber: 1 },
];

const PART_DETAILS: Record<
  WritingPart,
  { label: string; count: number; description: string }
> = {
  1: {
    label: "Viết câu theo tranh",
    count: 5,
    description: "Chọn 5 bài tập Published khác nhau.",
  },
  2: {
    label: "Trả lời email",
    count: 2,
    description: "Chọn 2 bài tập Published khác nhau.",
  },
  3: {
    label: "Viết bài luận",
    count: 1,
    description: "Chọn 1 bài tập Published.",
  },
};

function slotKey(slot: ExerciseSlot) {
  return `${slot.part}-${slot.sequenceNumber}`;
}

function initialSelections(test: WritingTest): Record<string, string> {
  return Object.fromEntries(
    REQUIRED_SLOTS.map((slot) => [
      slotKey(slot),
      test.questions.find(
        (question) =>
          question.part === slot.part &&
          question.sequenceNumber === slot.sequenceNumber,
      )?.exerciseId ?? "",
    ]),
  );
}

function partStatus(part: WritingPart, selections: Record<string, string>) {
  const slots = REQUIRED_SLOTS.filter((slot) => slot.part === part);
  return slots.filter((slot) => selections[slotKey(slot)]).length;
}

function isPublished(test: WritingTest) {
  return test.status === "PUBLISHED";
}

export function WritingTestWorkspace({ testId }: { testId: string }) {
  const [test, setTest] = useState<WritingTest | null>(null);
  const [exercises, setExercises] = useState<
    Record<WritingPart, WritingExercise[]>
  >({
    1: [],
    2: [],
    3: [],
  });
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [retry, setRetry] = useState(0);
  const [completedRequestKey, setCompletedRequestKey] = useState("");
  const [loadError, setLoadError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const requestKey = `${testId}:${retry}`;
  const loading = completedRequestKey !== requestKey;
  const error = loadError?.key === requestKey ? loadError.message : null;

  useEffect(() => {
    let active = true;
    Promise.all([
      getWritingTest(testId),
      getPublishedWritingExercises(1),
      getPublishedWritingExercises(2),
      getPublishedWritingExercises(3),
    ])
      .then(([loadedTest, partOne, partTwo, partThree]) => {
        if (!active) return;
        setTest(loadedTest);
        setCode(loadedTest.code);
        setTitle(loadedTest.title);
        setDescription(loadedTest.description);
        setSelections(initialSelections(loadedTest));
        setExercises({
          1: partOne.items,
          2: partTwo.items,
          3: partThree.items,
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setLoadError({
          key: requestKey,
          message:
            reason instanceof Error
              ? reason.message
              : "Không thể tải đề Writing.",
        });
      })
      .finally(() => {
        if (active) setCompletedRequestKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [requestKey, testId]);

  const assignedCount = useMemo(
    () => Object.values(selections).filter(Boolean).length,
    [selections],
  );
  const hasAllSlots = assignedCount === REQUIRED_SLOTS.length;
  const published = test ? isPublished(test) : false;

  function updateSelection(slot: ExerciseSlot, exerciseId: string) {
    setSelections((current) => ({ ...current, [slotKey(slot)]: exerciseId }));
  }

  function makeInput() {
    const questions = REQUIRED_SLOTS.map((slot) => ({
      exerciseId: selections[slotKey(slot)] ?? "",
      part: slot.part,
      sequenceNumber: slot.sequenceNumber,
    }));
    if (!code.trim() || !title.trim()) {
      throw new Error("Mã đề và tên đề là bắt buộc.");
    }
    if (questions.some((question) => !question.exerciseId)) {
      throw new Error("Chọn đủ 5–2–1 bài tập trước khi lưu đề Writing.");
    }
    if (
      new Set(questions.map((question) => question.exerciseId)).size !==
      questions.length
    ) {
      throw new Error(
        "Một bài tập chỉ được dùng một lần trong mỗi đề Writing.",
      );
    }
    return {
      code: code.trim(),
      title: title.trim(),
      description: description.trim() || null,
      questions,
    };
  }

  async function save() {
    if (!test) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await updateWritingTest(
        test.id,
        test.version,
        makeInput(),
      );
      setTest(updated);
      setCode(updated.code);
      setTitle(updated.title);
      setDescription(updated.description);
      setSelections(initialSelections(updated));
      setNotice("Đã lưu cấu trúc đề Writing.");
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Không thể lưu đề Writing.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!test) return;
    setPublishing(true);
    setNotice(null);
    try {
      const updated = await publishWritingTest(test.id, test.version);
      setTest(updated);
      setNotice("Đề Writing đã được xuất bản.");
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

  if (loading) {
    return (
      <div
        aria-busy="true"
        className="h-[620px] animate-pulse rounded-2xl bg-[var(--admin-skeleton)]"
      />
    );
  }

  if (error || !test) {
    return (
      <div
        className="rounded-2xl border border-[var(--admin-danger)]/20 bg-[var(--admin-danger-soft)] p-6 text-[var(--admin-danger)]"
        role="alert"
      >
        <p className="font-bold">Không thể mở đề Writing</p>
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
  }

  return (
    <div className="mx-auto max-w-[1480px]">
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--admin-muted)] transition hover:text-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
        href="/admin/exams?kind=writing"
      >
        <ExamIcon className="size-4" name="arrow-left" />
        Quay lại kho đề
      </Link>

      <header className="mt-5 rounded-2xl border border-[var(--admin-border)] bg-[linear-gradient(110deg,#fffdfc,#fff5ee)] p-5 shadow-[0_15px_36px_rgb(73_43_31/4%)] lg:flex lg:items-start lg:justify-between lg:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
              WRITING · PART 1–3
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                published
                  ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]"
                  : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"
              }`}
            >
              {published ? "Đã xuất bản" : "Bản nháp"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[var(--admin-ink)]">
            {test.code}
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Chọn bài tập đã Published từ ngân hàng hiện có để lắp ráp đề.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">
          <button
            className="h-10 rounded-lg border border-[var(--admin-border)] bg-white px-4 text-sm font-bold text-[var(--admin-ink-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={published || saving}
            onClick={() => void save()}
            type="button"
          >
            {saving ? "Đang lưu..." : "Lưu đề"}
          </button>
          <button
            className="admin-primary-action h-10 rounded-lg px-4 text-sm font-bold"
            disabled={published || publishing || !hasAllSlots}
            onClick={() => void publish()}
            type="button"
          >
            {publishing ? "Đang xuất bản..." : "Xuất bản đề"}
          </button>
        </div>
      </header>

      <section className="mt-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_16px_42px_rgb(73_43_31/4%)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-[var(--admin-brand-red)]">
              HOÀN THIỆN ĐỀ
            </p>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {assignedCount}/8 bài tập đã được chọn. Backend chỉ xuất bản khi
              đủ Part 1: 5, Part 2: 2 và Part 3: 1 bài tập Published.
            </p>
          </div>
          <strong className="text-2xl text-[var(--admin-ink)]">
            {Math.round((assignedCount / REQUIRED_SLOTS.length) * 100)}%
          </strong>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]">
          <div
            className="admin-brand-gradient-fill h-full rounded-full transition-[width]"
            style={{
              width: `${(assignedCount / REQUIRED_SLOTS.length) * 100}%`,
            }}
          />
        </div>
        {notice && (
          <output
            aria-live="polite"
            className={`mt-4 block rounded-xl p-3 text-sm ${
              notice.startsWith("Đã")
                ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]"
                : "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]"
            }`}
          >
            {notice}
          </output>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_16px_42px_rgb(73_43_31/4%)]">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-bold text-[var(--admin-ink)]">
            Mã đề
            <input
              className="mt-1.5 h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 font-medium outline-none focus:border-[var(--admin-brand-orange)] disabled:bg-stone-50"
              disabled={published || saving}
              maxLength={64}
              onChange={(event) => setCode(event.target.value)}
              value={code}
            />
          </label>
          <label className="block text-sm font-bold text-[var(--admin-ink)]">
            Tên đề
            <input
              className="mt-1.5 h-11 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 font-medium outline-none focus:border-[var(--admin-brand-orange)] disabled:bg-stone-50"
              disabled={published || saving}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </label>
          <label className="block text-sm font-bold text-[var(--admin-ink)] md:col-span-2">
            Mô tả
            <textarea
              className="mt-1.5 w-full rounded-lg border border-[var(--admin-border)] bg-white p-3 font-medium leading-6 outline-none focus:border-[var(--admin-brand-orange)] disabled:bg-stone-50"
              disabled={published || saving}
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              value={description}
            />
          </label>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {([1, 2, 3] as const).map((part) => {
          const details = PART_DETAILS[part];
          const slots = REQUIRED_SLOTS.filter((slot) => slot.part === part);
          const selectedExerciseIds = new Set(
            slots.map((slot) => selections[slotKey(slot)]).filter(Boolean),
          );
          const selected = partStatus(part, selections);
          return (
            <section
              className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_16px_42px_rgb(73_43_31/4%)]"
              key={part}
            >
              <header className="border-b border-[var(--admin-border)] bg-[linear-gradient(100deg,#fff9f5,#fffdfc)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.12em] text-[var(--admin-brand-red)]">
                      Part {part} · {details.count} bài
                    </p>
                    <h2 className="mt-1 font-bold text-[var(--admin-ink)]">
                      {details.label}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                      {details.description}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--admin-nav-active)] px-2.5 py-1 text-xs font-bold text-[var(--admin-brand-red)]">
                    {selected}/{details.count}
                  </span>
                </div>
              </header>
              <div className="space-y-3 p-4">
                {slots.map((slot) => {
                  const current = selections[slotKey(slot)] ?? "";
                  return (
                    <label
                      className="block rounded-xl border border-[var(--admin-border)] bg-white p-3 text-sm font-bold text-[var(--admin-ink)]"
                      key={slotKey(slot)}
                    >
                      Bài {slot.sequenceNumber}
                      <select
                        aria-label={`Bài tập Part ${part}, vị trí ${slot.sequenceNumber}`}
                        className="mt-2 h-10 w-full rounded-lg border border-[var(--admin-border)] bg-white px-2 text-sm font-medium text-[var(--admin-ink-soft)] outline-none focus:border-[var(--admin-brand-orange)] disabled:bg-stone-50"
                        disabled={published || saving}
                        onChange={(event) =>
                          updateSelection(slot, event.target.value)
                        }
                        value={current}
                      >
                        <option value="">Chọn bài tập Published</option>
                        {exercises[part].map((exercise) => (
                          <option
                            disabled={
                              exercise.id !== current &&
                              selectedExerciseIds.has(exercise.id)
                            }
                            key={exercise.id}
                            value={exercise.id}
                          >
                            {exercise.code} · {exercise.topic} ·{" "}
                            {exercise.difficulty}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
                {exercises[part].length < details.count && (
                  <p className="rounded-lg bg-[var(--admin-warning-soft)] p-3 text-xs leading-5 text-[var(--admin-warning)]">
                    Ngân hàng hiện có {exercises[part].length} bài Published cho
                    Part {part}; cần ít nhất {details.count} bài khác nhau để
                    xuất bản.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
