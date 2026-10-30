"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createReadingExam,
  getReadingExams,
  getScoreProfiles,
  importReadingExam,
} from "@/features/admin/exam-api";
import {
  formatAdminDate,
  type ReadingExamPage,
  type ScoreProfile,
} from "@/features/admin/exam-management";
import {
  createLrExerciseItem,
  getLrExerciseItems,
  getLrExerciseSummary,
  importLrExerciseItems,
  type CreateLrExerciseItemInput,
  type LrExerciseItem,
  type LrExercisePage,
  type LrExerciseSummary,
} from "@/features/admin/lr-exercise-bank-api";
import { ExamIcon } from "./exam-icon";

type BankTab = "exercises" | "tests";
type QuestionDraft = CreateLrExerciseItemInput["questions"][number];

const parts = [
  {
    part: 1,
    name: "Photographs",
    vietnamese: "Mô tả tranh",
    type: "Hình ảnh + Audio",
    grouped: false,
  },
  {
    part: 2,
    name: "Question – Response",
    vietnamese: "Hỏi – đáp",
    type: "Audio",
    grouped: false,
  },
  {
    part: 3,
    name: "Short Conversations",
    vietnamese: "Hội thoại ngắn",
    type: "Cụm câu hỏi + Audio",
    grouped: true,
  },
  {
    part: 4,
    name: "Short Talks",
    vietnamese: "Bài nói ngắn",
    type: "Cụm câu hỏi + Audio",
    grouped: true,
  },
  {
    part: 5,
    name: "Incomplete Sentences",
    vietnamese: "Điền câu",
    type: "Text đơn",
    grouped: false,
  },
  {
    part: 6,
    name: "Text Completion",
    vietnamese: "Điền đoạn văn",
    type: "Cụm câu hỏi + Text",
    grouped: true,
  },
  {
    part: 7,
    name: "Reading Comprehension",
    vietnamese: "Đọc hiểu",
    type: "Cụm câu hỏi + Đoạn văn",
    grouped: true,
  },
] as const;

const blankQuestion = (part: number, index = 1): QuestionDraft => ({
  code: `P${part}-${String(index).padStart(3, "0")}`,
  prompt: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: part === 2 ? null : "",
  correctKey: "A",
  translation: null,
  explanation: null,
});

function minimumQuestionCount(part: number) {
  if (part === 3 || part === 4) return 3;
  if (part === 6) return 4;
  if (part === 7) return 2;
  return 1;
}

function maximumQuestionCount(part: number) {
  return part === 7 ? 5 : minimumQuestionCount(part);
}

function selectedTab(params: URLSearchParams): BankTab {
  return params.get("tab") === "tests" ? "tests" : "exercises";
}

function selectedPart(params: URLSearchParams): number | null {
  const value = Number(params.get("part"));
  return Number.isInteger(value) && value >= 1 && value <= 7 ? value : null;
}

function statusLabel(status: string) {
  return status === "PUBLISHED" || status === "Published"
    ? "Hiển thị"
    : "Bản nháp";
}

function StatusBadge({ status }: { status: string }) {
  const published = status === "PUBLISHED" || status === "Published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        published
          ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]"
          : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"
      }`}
    >
      <i className="size-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

export function DataBankCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const tab = useMemo(
    () => selectedTab(new URLSearchParams(paramsString)),
    [paramsString],
  );
  const part = useMemo(
    () => selectedPart(new URLSearchParams(paramsString)),
    [paramsString],
  );
  const viewingPartWorkspace = tab === "exercises" && part !== null;
  const [summary, setSummary] = useState<LrExerciseSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryRefresh, setSummaryRefresh] = useState(0);
  const summaryLoading = summary === null && summaryError === null;

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(paramsString);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      });
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [paramsString, pathname, router],
  );

  useEffect(() => {
    if (tab !== "exercises") return;
    const controller = new AbortController();
    getLrExerciseSummary(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setSummary(value);
          setSummaryError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setSummaryError(
            reason instanceof Error
              ? reason.message
              : "Không thể tải ngân hàng bài tập.",
          );
      });
    return () => controller.abort();
  }, [summaryRefresh, tab]);

  return (
    <div className="mx-auto max-w-[1480px]">
      {!viewingPartWorkspace && (
        <>
          <header className="mb-7">
            <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
              QUẢN TRỊ / KHO DỮ LIỆU
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">
              Kho dữ liệu
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
              Quản lý ngân hàng bài tập và đề TOEIC Listening &amp; Reading
              trong hệ thống.
            </p>
          </header>

          <div
            className="mb-5 flex border-b border-[var(--admin-border)]"
            role="tablist"
            aria-label="Kho dữ liệu"
          >
            <TabButton
              active={tab === "exercises"}
              onClick={() => updateQuery({ tab: null, part: null })}
            >
              Bài tập
            </TabButton>
            <TabButton
              active={tab === "tests"}
              onClick={() => updateQuery({ tab: "tests", part: null })}
            >
              Đề thi
            </TabButton>
          </div>
        </>
      )}

      {tab === "exercises" ? (
        <ExerciseBank
          error={summaryError}
          loading={summaryLoading}
          onRetry={() => {
            setSummaryError(null);
            setSummaryRefresh((value) => value + 1);
          }}
          onSelectPart={(selected) =>
            updateQuery({ part: selected === null ? null : String(selected) })
          }
          onSummaryChange={setSummary}
          part={part}
          summary={summary}
        />
      ) : (
        <CompleteTests />
      )}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={`border-b-2 px-4 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)] ${
        active
          ? "border-[var(--admin-brand-red)] text-[var(--admin-ink)]"
          : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
      }`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {children}
    </button>
  );
}

function ExerciseBank({
  error,
  loading,
  onRetry,
  onSelectPart,
  onSummaryChange,
  part,
  summary,
}: {
  error: string | null;
  loading: boolean;
  onRetry: () => void;
  onSelectPart: (part: number | null) => void;
  onSummaryChange: (summary: LrExerciseSummary) => void;
  part: number | null;
  summary: LrExerciseSummary | null;
}) {
  const current = part
    ? (parts.find((candidate) => candidate.part === part) ?? null)
    : null;
  if (current)
    return (
      <PartWorkspace
        definition={current}
        onBack={() => onSelectPart(null)}
        onSummaryChange={onSummaryChange}
        summary={summary}
      />
    );

  return (
    <>
      <section
        aria-label="Phạm vi ngân hàng dữ liệu"
        className="mb-4 overflow-hidden rounded-2xl border border-[#ffd2c1] bg-[#fff7f2] p-1"
      >
        <div
          className="rounded-xl px-5 py-4 text-white shadow-[0_8px_20px_rgb(236_37_27/24%)]"
          style={{ background: "var(--admin-brand-gradient)" }}
        >
          <p className="text-sm font-bold">Listening &amp; Reading</p>
          <p className="mt-0.5 text-xs text-white/80">7 Part cố định</p>
        </div>
      </section>

      {loading ? (
        <div aria-busy="true" className="space-y-4">
          <div className="h-20 animate-pulse rounded-2xl bg-[var(--admin-skeleton)]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {parts.map((definition) => (
              <div
                className="h-36 animate-pulse rounded-2xl bg-[var(--admin-skeleton)]"
                key={definition.part}
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorPanel
          message={error}
          onRetry={onRetry}
          title="Không thể tải ngân hàng bài tập"
        />
      ) : (
        <>
          <section className="mb-6 flex flex-wrap items-center gap-7 rounded-2xl border border-[#ffbca5] bg-[linear-gradient(100deg,#fff1ea,#fffdfb)] px-5 py-4 shadow-[0_10px_28px_rgb(255_108_13/8%)]">
            <div>
              <p className="text-xs text-[var(--admin-muted)]">
                Tổng số câu hỏi
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--admin-brand-orange)]">
                {(summary?.totalQuestionCount ?? 0).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="h-9 w-px bg-[var(--admin-border)]" />
            <div>
              <p className="text-xs text-[var(--admin-muted)]">
                Cập nhật gần nhất
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--admin-brand-red)]">
                {summary?.updatedAtUtc
                  ? formatAdminDate(summary.updatedAtUtc)
                  : "Chưa có dữ liệu"}
              </p>
            </div>
          </section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--admin-ink)]">
                Listening &amp; Reading
              </h2>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Chọn Part để xem, thêm thủ công hoặc import ngân hàng bài tập.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--admin-muted)]">
              7 Parts
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {parts.map((definition) => {
              const metrics = summary?.parts.find(
                (item) => item.part === definition.part,
              );
              return (
                <button
                  className="group min-h-36 rounded-2xl border border-[#ffc5b0] border-t-4 border-t-[var(--admin-brand-orange)] bg-[linear-gradient(135deg,#fff9f6,#fff)] p-4 text-left shadow-[0_7px_18px_rgb(255_108_13/5%)] transition hover:-translate-y-0.5 hover:border-[var(--admin-brand-orange)] hover:shadow-[0_16px_32px_rgb(255_108_13/16%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
                  key={definition.part}
                  onClick={() => onSelectPart(definition.part)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[var(--admin-ink)]">
                        Part {definition.part}: {definition.name}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        {definition.vietnamese}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[var(--admin-brand-orange)]">
                      {(metrics?.questionCount ?? 0).toLocaleString("vi-VN")}{" "}
                      câu
                    </span>
                  </div>
                  <span className="mt-5 inline-flex rounded-md bg-[#fff0e8] px-2 py-1 text-[11px] font-bold text-[var(--admin-brand-orange)]">
                    {definition.type}
                  </span>
                  <span className="mt-4 flex items-center justify-between border-t border-[#ffd8cb] pt-3 text-xs font-bold text-[var(--admin-brand-orange)]">
                    Xem bài tập <span aria-hidden="true">→</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function PartWorkspace({
  definition,
  onBack,
  onSummaryChange,
  summary,
}: {
  definition: (typeof parts)[number];
  onBack: () => void;
  onSummaryChange: (summary: LrExerciseSummary) => void;
  summary: LrExerciseSummary | null;
}) {
  const [items, setItems] = useState<LrExercisePage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const loading = items === null && error === null;

  const load = useCallback(
    (signal?: AbortSignal) =>
      getLrExerciseItems(
        definition.part,
        { query, difficulty, status, page: 1 },
        signal,
      ),
    [definition.part, difficulty, query, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setItems(value);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Không thể tải danh sách bài tập.",
          );
      });
    return () => controller.abort();
  }, [load, retry]);

  const count =
    summary?.parts.find((item) => item.part === definition.part)
      ?.questionCount ??
    items?.totalCount ??
    0;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <button
            className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--admin-muted)] hover:text-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
            onClick={onBack}
            type="button"
          >
            <ExamIcon className="size-4" name="arrow-left" /> Quay lại ngân hàng
          </button>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--admin-ink)]">
            Part {definition.part}: {definition.name}{" "}
            <span className="text-lg">({definition.vietnamese})</span>
          </h2>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Quản lý {count.toLocaleString("vi-VN")} câu hỏi trong ngân hàng độc
            lập của Part này.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-bold text-[var(--admin-ink-soft)] transition hover:border-[var(--admin-brand-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            href={`/api/admin/lr-exercise-bank/templates/${definition.part}`}
          >
            <ExamIcon className="size-4" name="file" /> Tải file mẫu
          </a>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-bold text-[var(--admin-ink-soft)] transition hover:border-[var(--admin-brand-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            onClick={() => setImportOpen(true)}
            type="button"
          >
            <ExamIcon className="size-4" name="import" /> Import từ Excel
          </button>
          <button
            className="admin-primary-action inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            <ExamIcon className="size-4" name="plus" />
            {definition.grouped ? "Thêm cụm bài tập" : "Thêm câu hỏi"}
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_16px_42px_rgb(73_43_31/4%)]">
        <div className="flex flex-wrap gap-3 border-b border-[var(--admin-border)] bg-[linear-gradient(100deg,#fffdfc,#fff8f3)] p-4">
          <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white px-3 text-[var(--admin-muted)] focus-within:border-[var(--admin-brand-orange)] focus-within:ring-2 focus-within:ring-orange-100">
            <ExamIcon className="size-4" name="search" />
            <input
              aria-label="Tìm kiếm bài tập"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--admin-ink)] outline-none placeholder:text-[var(--admin-muted)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo mã hoặc nội dung câu hỏi..."
              value={query}
            />
          </label>
          <FilterSelect
            label="Độ khó"
            onChange={setDifficulty}
            value={difficulty}
            values={["EASY", "MEDIUM", "HARD"]}
          />
          <FilterSelect
            label="Trạng thái"
            onChange={setStatus}
            value={status}
            values={["DRAFT", "PUBLISHED", "ARCHIVED"]}
          />
        </div>
        {loading ? (
          <div aria-busy="true" className="space-y-3 p-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                className="h-14 animate-pulse rounded-lg bg-[var(--admin-skeleton)]"
                key={index}
              />
            ))}
          </div>
        ) : error ? (
          <ErrorPanel
            message={error}
            onRetry={() => {
              setError(null);
              setItems(null);
              setRetry((value) => value + 1);
            }}
            title="Không thể tải danh sách bài tập"
          />
        ) : (items?.items.length ?? 0) === 0 ? (
          <EmptyPart definition={definition} />
        ) : (
          <ItemTable
            definition={definition}
            items={items?.items ?? []}
            total={items?.totalCount ?? 0}
          />
        )}
      </section>
      {importOpen && (
        <ImportPartModal
          definition={definition}
          onClose={() => setImportOpen(false)}
          onComplete={(nextSummary) => {
            onSummaryChange(nextSummary);
            setImportOpen(false);
            setRetry((value) => value + 1);
          }}
        />
      )}
      {createOpen && (
        <CreatePartDrawer
          definition={definition}
          onClose={() => setCreateOpen(false)}
          onComplete={() => {
            setCreateOpen(false);
            setRetry((value) => value + 1);
            getLrExerciseSummary()
              .then(onSummaryChange)
              .catch(() => undefined);
          }}
        />
      )}
    </>
  );
}

function FilterSelect({
  label,
  onChange,
  value,
  values,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  values: string[];
}) {
  return (
    <select
      aria-label={label}
      className="h-10 rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm font-medium text-[var(--admin-ink-soft)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">{label}: Tất cả</option>
      {values.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function EmptyPart({ definition }: { definition: (typeof parts)[number] }) {
  return (
    <div className="px-6 py-20 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]">
        <ExamIcon className="size-6" name="book" />
      </span>
      <h3 className="mt-4 text-base font-bold text-[var(--admin-ink)]">
        Chưa có bài tập Part {definition.part}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[var(--admin-muted)]">
        Tải file mẫu để nhập Excel, hoặc thêm{" "}
        {definition.grouped ? "một cụm bài tập" : "một câu hỏi"} thủ công.
      </p>
    </div>
  );
}

function ItemTable({
  definition,
  items,
  total,
}: {
  definition: (typeof parts)[number];
  items: LrExerciseItem[];
  total: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[920px] w-full text-left">
        <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[10px] font-bold tracking-[0.11em] text-[var(--admin-muted)]">
          <tr>
            <th className="px-5 py-3">MÃ</th>
            <th className="px-5 py-3">NỘI DUNG</th>
            <th className="px-5 py-3">DỮ LIỆU CHUNG</th>
            <th className="px-5 py-3">SỐ CÂU</th>
            <th className="px-5 py-3">CHỦ ĐỀ</th>
            <th className="px-5 py-3">ĐỘ KHÓ</th>
            <th className="px-5 py-3">TRẠNG THÁI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)]">
          {items.map((item) => {
            const first = item.questions[0];
            return (
              <tr className="hover:bg-[var(--admin-row-hover)]" key={item.id}>
                <td className="px-5 py-4 text-sm font-bold text-[var(--admin-brand-red)]">
                  {item.code}
                </td>
                <td className="max-w-[380px] px-5 py-4">
                  <p className="line-clamp-2 text-sm font-semibold text-[var(--admin-ink)]">
                    {definition.grouped ? item.context : first?.prompt}
                  </p>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {definition.grouped
                      ? first?.prompt
                      : item.audioUrl
                        ? "Có audio đính kèm"
                        : "Câu hỏi độc lập"}
                  </p>
                </td>
                <td className="px-5 py-4 text-xs text-[var(--admin-ink-soft)]">
                  {item.audioUrl ? "Audio" : "Text"}
                  {item.imageUrl ? " · Hình ảnh" : ""}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-[var(--admin-nav-active)] px-2.5 py-1 text-xs font-bold text-[var(--admin-brand-red)]">
                    {item.questions.length} câu
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-[var(--admin-surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--admin-ink-soft)]">
                    {item.topic}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs font-bold text-[var(--admin-ink-soft)]">
                  {item.difficulty}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <footer className="border-t border-[var(--admin-border)] px-5 py-3 text-xs text-[var(--admin-muted)]">
        Hiển thị {items.length} / {total.toLocaleString("vi-VN")}{" "}
        {definition.grouped ? "cụm bài tập" : "câu hỏi"}
      </footer>
    </div>
  );
}

function ImportPartModal({
  definition,
  onClose,
  onComplete,
}: {
  definition: (typeof parts)[number];
  onClose: () => void;
  onComplete: (summary: LrExerciseSummary) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Hãy chọn file Excel .xlsx trước khi import.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onComplete(await importLrExerciseItems(definition.part, file));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể import file Excel.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      onClose={onClose}
      subtitle="Workbook sẽ được kiểm tra theo cấu trúc của Part này trước khi lưu toàn bộ dữ liệu."
      title={`Import Part ${definition.part} từ Excel`}
    >
      <form onSubmit={submit}>
        <a
          className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--admin-brand-red)]/25 bg-[var(--admin-danger-soft)] px-3 py-3 text-sm font-bold text-[var(--admin-brand-red)] hover:underline"
          href={`/api/admin/lr-exercise-bank/templates/${definition.part}`}
        >
          <ExamIcon className="size-4" name="file" /> Tải file mẫu Excel (.xlsx)
        </a>
        <label className="grid min-h-36 cursor-pointer place-items-center rounded-xl border border-dashed border-[var(--admin-brand-orange)] bg-[var(--admin-surface-muted)] px-4 text-center">
          <span>
            <ExamIcon
              className="mx-auto size-6 text-[var(--admin-brand-red)]"
              name="upload"
            />
            <span className="mt-3 block text-sm font-bold text-[var(--admin-ink)]">
              {file ? file.name : "Chọn file Excel (.xlsx)"}
            </span>
            <span className="mt-1 block text-xs text-[var(--admin-muted)]">
              Dung lượng tối đa 10MB
            </span>
          </span>
          <input
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) =>
              setFile(event.currentTarget.files?.[0] ?? null)
            }
            type="file"
          />
        </label>
        {error && (
          <p
            className="mt-3 rounded-lg bg-[var(--admin-danger-soft)] p-3 text-sm text-[var(--admin-danger)]"
            role="alert"
          >
            {error}
          </p>
        )}
        <ModalFooter busy={busy} label="Tải lên và import" onClose={onClose} />
      </form>
    </Modal>
  );
}

function CreatePartDrawer({
  definition,
  onClose,
  onComplete,
}: {
  definition: (typeof parts)[number];
  onClose: () => void;
  onComplete: () => void;
}) {
  const [input, setInput] = useState<CreateLrExerciseItemInput>({
    code: `P${definition.part}-${definition.grouped ? "G-" : ""}001`,
    topic: "",
    difficulty: "EASY",
    status: "DRAFT",
    context: definition.grouped ? "" : null,
    audioUrl: null,
    imageUrl: null,
    questions: Array.from(
      { length: minimumQuestionCount(definition.part) },
      (_, index) => blankQuestion(definition.part, index + 1),
    ),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patchQuestion = (
    index: number,
    field: keyof QuestionDraft,
    value: string | null,
  ) =>
    setInput((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question,
      ),
    }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createLrExerciseItem(definition.part, input);
      onComplete();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể lưu bài tập.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        aria-label="Đóng form thêm bài tập"
        className="absolute inset-0 bg-stone-950/35 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label={`Thêm Part ${definition.part}`}
        className="relative flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-[var(--admin-surface)] shadow-2xl"
      >
        <header className="sticky top-0 z-10 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-5">
          <button
            aria-label="Đóng"
            className="absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)]"
            onClick={onClose}
            type="button"
          >
            <ExamIcon className="size-5" name="close" />
          </button>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
            PART {definition.part}: {definition.name}
          </p>
          <h2 className="mt-2 text-xl font-bold text-[var(--admin-ink)]">
            Thêm {definition.grouped ? "cụm bài tập" : "câu hỏi"} mới
          </h2>
        </header>
        <form className="flex flex-1 flex-col" onSubmit={submit}>
          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Mã"
                onChange={(value) =>
                  setInput((current) => ({ ...current, code: value }))
                }
                required
                value={input.code}
              />
              <TextField
                label="Chủ đề"
                onChange={(value) =>
                  setInput((current) => ({ ...current, topic: value }))
                }
                required
                value={input.topic}
              />
              <SelectField
                label="Độ khó"
                onChange={(value) =>
                  setInput((current) => ({
                    ...current,
                    difficulty:
                      value as CreateLrExerciseItemInput["difficulty"],
                  }))
                }
                value={input.difficulty}
                values={["EASY", "MEDIUM", "HARD"]}
              />
              <SelectField
                label="Trạng thái"
                onChange={(value) =>
                  setInput((current) => ({
                    ...current,
                    status: value as CreateLrExerciseItemInput["status"],
                  }))
                }
                value={input.status}
                values={["DRAFT", "PUBLISHED"]}
              />
            </div>
            {definition.grouped && (
              <TextArea
                label="Nội dung chung / transcript"
                onChange={(value) =>
                  setInput((current) => ({ ...current, context: value }))
                }
                required
                value={input.context ?? ""}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Audio URL (không bắt buộc)"
                onChange={(value) =>
                  setInput((current) => ({
                    ...current,
                    audioUrl: value || null,
                  }))
                }
                value={input.audioUrl ?? ""}
              />
              <TextField
                label="Image URL (không bắt buộc)"
                onChange={(value) =>
                  setInput((current) => ({
                    ...current,
                    imageUrl: value || null,
                  }))
                }
                value={input.imageUrl ?? ""}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--admin-ink)]">
                  Câu hỏi con
                </h3>
                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                  {definition.grouped
                    ? definition.part === 7
                      ? "Part 7 chứa từ 2 đến 5 câu hỏi con."
                      : `Part ${definition.part} chứa đúng ${minimumQuestionCount(definition.part)} câu hỏi con.`
                    : "Part này chỉ chứa đúng một câu hỏi."}
                </p>
              </div>
              {definition.grouped &&
                input.questions.length <
                  maximumQuestionCount(definition.part) && (
                  <button
                    className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-bold text-[var(--admin-brand-red)] hover:border-[var(--admin-brand-orange)]"
                    onClick={() =>
                      setInput((current) => ({
                        ...current,
                        questions: [
                          ...current.questions,
                          blankQuestion(
                            definition.part,
                            current.questions.length + 1,
                          ),
                        ],
                      }))
                    }
                    type="button"
                  >
                    + Thêm câu
                  </button>
                )}
            </div>
            {input.questions.map((question, index) => (
              <QuestionEditor
                key={`${question.code}-${index}`}
                index={index}
                onChange={patchQuestion}
                part={definition.part}
                question={question}
              />
            ))}
            {error && (
              <p
                className="rounded-lg bg-[var(--admin-danger-soft)] p-3 text-sm text-[var(--admin-danger)]"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
          <footer className="sticky bottom-0 mt-auto flex justify-end gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-4">
            <button
              className="h-10 rounded-lg px-4 text-sm font-bold text-[var(--admin-ink-soft)] hover:bg-[var(--admin-surface-muted)]"
              onClick={onClose}
              type="button"
            >
              Hủy
            </button>
            <button
              className="admin-primary-action h-10 rounded-lg px-4 text-sm font-bold"
              disabled={busy}
              type="submit"
            >
              {busy ? "Đang lưu..." : "Lưu bài tập"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function QuestionEditor({
  index,
  onChange,
  part,
  question,
}: {
  index: number;
  onChange: (
    index: number,
    field: keyof QuestionDraft,
    value: string | null,
  ) => void;
  part: number;
  question: QuestionDraft;
}) {
  return (
    <fieldset className="rounded-xl border border-[var(--admin-border)] p-4">
      <legend className="px-1 text-sm font-bold text-[var(--admin-ink)]">
        Câu {index + 1}
      </legend>
      <div className="grid gap-4">
        <TextField
          label="Mã câu hỏi"
          onChange={(value) => onChange(index, "code", value)}
          required
          value={question.code}
        />
        <TextArea
          label="Nội dung câu hỏi"
          onChange={(value) => onChange(index, "prompt", value)}
          required
          value={question.prompt}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {(["A", "B", "C", "D"] as const)
            .filter((option) => option !== "D" || part !== 2)
            .map((option) => (
              <TextField
                key={option}
                label={`Đáp án ${option}`}
                onChange={(value) =>
                  onChange(
                    index,
                    `option${option}` as keyof QuestionDraft,
                    value,
                  )
                }
                required
                value={(question[`option${option}`] ?? "") as string}
              />
            ))}
        </div>
        <SelectField
          label="Đáp án đúng"
          onChange={(value) => onChange(index, "correctKey", value)}
          value={question.correctKey}
          values={part === 2 ? ["A", "B", "C"] : ["A", "B", "C", "D"]}
        />
        <TextArea
          label="Giải thích (không bắt buộc)"
          onChange={(value) => onChange(index, "explanation", value || null)}
          value={question.explanation ?? ""}
        />
      </div>
    </fieldset>
  );
}

function TextField({
  label,
  onChange,
  required,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block text-sm font-bold text-[var(--admin-ink-soft)]">
      {label}
      {required && <span className="text-[var(--admin-brand-red)]"> *</span>}
      <input
        className="mt-2 h-10 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm font-normal text-[var(--admin-ink)] outline-none focus:border-[var(--admin-brand-orange)] focus:ring-2 focus:ring-orange-100"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}
function TextArea({
  label,
  onChange,
  required,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block text-sm font-bold text-[var(--admin-ink-soft)]">
      {label}
      {required && <span className="text-[var(--admin-brand-red)]"> *</span>}
      <textarea
        className="mt-2 min-h-24 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-sm font-normal text-[var(--admin-ink)] outline-none focus:border-[var(--admin-brand-orange)] focus:ring-2 focus:ring-orange-100"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}
function SelectField({
  label,
  onChange,
  value,
  values,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  values: string[];
}) {
  return (
    <label className="block text-sm font-bold text-[var(--admin-ink-soft)]">
      {label}
      <select
        className="mt-2 h-10 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm font-normal text-[var(--admin-ink)] outline-none focus:border-[var(--admin-brand-orange)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompleteTests() {
  const router = useRouter();
  const [result, setResult] = useState<ReadingExamPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [profiles, setProfiles] = useState<ScoreProfile[] | null>(null);
  const loading = result === null && error === null;
  useEffect(() => {
    const controller = new AbortController();
    getReadingExams({ status: "ALL", page: 1, pageSize: 20 }, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setResult(value);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Không thể tải danh sách đề thi.",
          );
      });
    return () => controller.abort();
  }, [retry]);
  async function openCreate() {
    setCreateOpen(true);
    if (profiles) return;
    try {
      setProfiles(await getScoreProfiles());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tải barem điểm.",
      );
    }
  }
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--admin-ink)]">
            Đề thi Listening &amp; Reading
          </h2>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Tạo hoặc import một đề TOEIC hoàn chỉnh 200 câu. Ngân hàng bài tập
            theo Part nằm ở tab Bài tập.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-bold text-[var(--admin-ink-soft)]"
            onClick={() => setImportOpen(true)}
            type="button"
          >
            <ExamIcon className="size-4" name="import" /> Import đề
          </button>
          <button
            className="admin-primary-action inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            onClick={openCreate}
            type="button"
          >
            <ExamIcon className="size-4" name="plus" /> Tạo đề mới
          </button>
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_16px_42px_rgb(73_43_31/4%)]">
        {loading ? (
          <div aria-busy="true" className="space-y-3 p-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                className="h-14 animate-pulse rounded-lg bg-[var(--admin-skeleton)]"
                key={index}
              />
            ))}
          </div>
        ) : error ? (
          <ErrorPanel
            message={error}
            onRetry={() => {
              setError(null);
              setResult(null);
              setRetry((value) => value + 1);
            }}
            title="Không thể tải danh sách đề thi"
          />
        ) : (result?.items.length ?? 0) === 0 ? (
          <div className="px-6 py-20 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]">
              <ExamIcon className="size-6" name="book" />
            </span>
            <h3 className="mt-4 text-base font-bold text-[var(--admin-ink)]">
              Chưa có đề thi hoàn chỉnh
            </h3>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Tạo bản nháp hoặc import workbook 200 câu cùng master audio.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left">
              <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[10px] font-bold tracking-[0.11em] text-[var(--admin-muted)]">
                <tr>
                  <th className="px-5 py-3">MÃ ĐỀ</th>
                  <th className="px-5 py-3">TÊN ĐỀ</th>
                  <th className="px-5 py-3">PHẠM VI</th>
                  <th className="px-5 py-3">CẬP NHẬT</th>
                  <th className="px-5 py-3">TRẠNG THÁI</th>
                  <th aria-label="Thao tác" className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {result?.items.map((item) => (
                  <tr
                    className="hover:bg-[var(--admin-row-hover)]"
                    key={item.revisionId}
                  >
                    <td className="px-5 py-4 text-sm font-bold text-[var(--admin-brand-red)]">
                      {item.code}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--admin-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        Revision {item.versionNumber} · 200 câu
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[var(--admin-nav-active)] px-2.5 py-1 text-xs font-bold text-[var(--admin-brand-red)]">
                        Listening &amp; Reading
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--admin-muted)]">
                      {formatAdminDate(item.createdAtUtc)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        aria-label={`Mở ${item.code}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-ink-soft)] hover:border-[var(--admin-brand-orange)] hover:text-[var(--admin-brand-red)]"
                        href={`/admin/exams/reading/${item.examId}/${item.revisionId}`}
                      >
                        <ExamIcon className="size-4" name="edit" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {createOpen && (
        <CreateExamModal
          error={error}
          onClose={() => setCreateOpen(false)}
          onCreated={(draft) =>
            router.push(
              `/admin/exams/reading/${draft.examId}/${draft.revisionId}`,
            )
          }
          profiles={profiles}
        />
      )}
      {importOpen && (
        <ImportExamModal
          error={error}
          onClose={() => setImportOpen(false)}
          onCreated={(draft) =>
            router.push(
              `/admin/exams/reading/${draft.examId}/${draft.revisionId}`,
            )
          }
        />
      )}
    </>
  );
}

function CreateExamModal({
  error: initialError,
  onClose,
  onCreated,
  profiles,
}: {
  error: string | null;
  onClose: () => void;
  onCreated: (draft: { examId: string; revisionId: string }) => void;
  profiles: ScoreProfile[] | null;
}) {
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      onCreated(
        await createReadingExam({
          code: String(data.get("code") ?? "").trim(),
          title: String(data.get("title") ?? "").trim(),
          scoreProfileId: String(data.get("scoreProfileId") ?? ""),
        }),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tạo đề thi.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      onClose={onClose}
      subtitle="Hệ thống tạo một bản nháp có đúng 200 slot Listening & Reading."
      title="Tạo đề thi mới"
    >
      <form onSubmit={submit}>
        <div className="space-y-4">
          <label className="block text-sm font-bold text-[var(--admin-ink-soft)]">
            Mã đề<span className="text-[var(--admin-brand-red)]"> *</span>
            <input
              className="mt-2 h-10 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm font-normal text-[var(--admin-ink)]"
              name="code"
              required
            />
          </label>
          <label className="block text-sm font-bold text-[var(--admin-ink-soft)]">
            Tên đề<span className="text-[var(--admin-brand-red)]"> *</span>
            <input
              className="mt-2 h-10 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm font-normal text-[var(--admin-ink)]"
              name="title"
              required
            />
          </label>
          <label className="block text-sm font-bold text-[var(--admin-ink-soft)]">
            Barem điểm
            <select
              className="mt-2 h-10 w-full rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm font-normal"
              disabled={!profiles}
              name="scoreProfileId"
              required
            >
              <option value="">
                {profiles ? "Chọn barem" : "Đang tải barem..."}
              </option>
              {profiles?.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                  {profile.isComplete ? "" : " (chưa đủ 101 mốc)"}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p
            className="mt-3 rounded-lg bg-[var(--admin-danger-soft)] p-3 text-sm text-[var(--admin-danger)]"
            role="alert"
          >
            {error}
          </p>
        )}
        <ModalFooter
          busy={busy}
          disabled={!profiles?.length}
          label="Tạo bản nháp"
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

function ImportExamModal({
  error: initialError,
  onClose,
  onCreated,
}: {
  error: string | null;
  onClose: () => void;
  onCreated: (draft: { examId: string; revisionId: string }) => void;
}) {
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const workbook = data.get("workbook");
    const masterAudio = data.get("masterAudio");
    if (!(workbook instanceof File) || !(masterAudio instanceof File)) {
      setError("Chọn workbook XLSX và master audio trước khi import.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onCreated(await importReadingExam(workbook, masterAudio));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể import đề thi.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      onClose={onClose}
      subtitle="Workbook cần có Manifest, Blocks, ContextBlocks và Questions; master audio là bắt buộc."
      title="Import đề thi hoàn chỉnh"
    >
      <form onSubmit={submit}>
        <div className="space-y-4">
          <Link
            className="flex items-center gap-2 rounded-lg border border-[var(--admin-brand-red)]/25 bg-[var(--admin-danger-soft)] px-3 py-3 text-sm font-bold text-[var(--admin-brand-red)] transition hover:bg-[var(--admin-nav-active)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            download
            href="/api/admin/exams/import-template"
            prefetch={false}
          >
            <ExamIcon className="size-4" name="file" /> Tải file Excel mẫu 200
            câu
          </Link>
          <p className="-mt-2 text-xs leading-5 text-[var(--admin-muted)]">
            Thay ScoreProfileId, các mã ImageAssetId ở Part 1 và nội dung mẫu
            trước khi import. Master audio vẫn tải riêng ở bên dưới.
          </p>
          <FileField accept=".xlsx" label="Workbook XLSX" name="workbook" />
          <FileField
            accept="audio/mpeg,audio/wav,.mp3,.wav"
            label="Master audio"
            name="masterAudio"
          />
        </div>
        {error && (
          <p
            className="mt-3 rounded-lg bg-[var(--admin-danger-soft)] p-3 text-sm text-[var(--admin-danger)]"
            role="alert"
          >
            {error}
          </p>
        )}
        <ModalFooter
          busy={busy}
          label="Import và mở bản nháp"
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

function FileField({
  accept,
  label,
  name,
}: {
  accept: string;
  label: string;
  name: string;
}) {
  return (
    <label className="block text-sm font-bold text-[var(--admin-ink-soft)]">
      {label}
      <input
        accept={accept}
        className="mt-2 block w-full rounded-lg border border-[var(--admin-border)] bg-white p-2 text-sm font-normal"
        name={name}
        required
        type="file"
      />
    </label>
  );
}

function ErrorPanel({
  message,
  onRetry,
  title,
}: {
  message: string;
  onRetry: () => void;
  title: string;
}) {
  return (
    <div
      className="m-5 rounded-xl border border-[var(--admin-danger)]/20 bg-[var(--admin-danger-soft)] p-5 text-[var(--admin-danger)]"
      role="alert"
    >
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
      <button
        className="mt-3 rounded-lg border border-current px-3 py-2 text-sm font-bold"
        onClick={onRetry}
        type="button"
      >
        Thử lại
      </button>
    </div>
  );
}

function Modal({
  children,
  onClose,
  subtitle,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button
        aria-label="Đóng hộp thoại"
        className="absolute inset-0 bg-stone-950/35 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <dialog
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl"
        open
      >
        <button
          aria-label="Đóng"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)]"
          onClick={onClose}
          type="button"
        >
          <ExamIcon className="size-5" name="close" />
        </button>
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]">
          <ExamIcon className="size-5" name="file" />
        </span>
        <h2 className="mt-4 pr-10 text-xl font-bold text-[var(--admin-ink)]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
          {subtitle}
        </p>
        <div className="mt-5">{children}</div>
      </dialog>
    </div>
  );
}
function ModalFooter({
  busy,
  disabled,
  label,
  onClose,
}: {
  busy: boolean;
  disabled?: boolean;
  label: string;
  onClose: () => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center border-t border-[var(--admin-border)] pt-4">
      <button
        className="col-start-2 h-10 justify-self-center rounded-lg px-4 text-sm font-bold text-[var(--admin-ink-soft)] hover:bg-[var(--admin-surface-muted)]"
        onClick={onClose}
        type="button"
      >
        Hủy
      </button>
      <button
        className="admin-primary-action col-start-3 h-10 justify-self-end rounded-lg px-4 text-sm font-bold"
        disabled={busy || disabled}
        type="submit"
      >
        {busy ? "Đang xử lý..." : label}
      </button>
    </div>
  );
}
