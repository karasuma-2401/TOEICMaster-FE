"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  bestExamScore,
  difficultyLabels,
  selectExams,
  type ExamDifficulty,
  type ExamDifficultyFilter,
  type ExamLibraryItem,
  type ExamSort,
  type ExamStatusFilter,
} from "./exam-library-model";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "./state-panels";
import { focusRing, primaryAction, wideContainer } from "./styles";

const pageSize = 6;

const accents = {
  listening: "bg-(--sp-lr-bg) text-(--sp-lr) ring-(--sp-lr)/20",
  reading: "bg-amber-50 text-amber-800 ring-amber-700/20",
  speaking: "bg-(--sp-speak-bg) text-(--sp-speak) ring-(--sp-speak)/20",
  writing: "bg-(--sp-write-bg) text-(--sp-write) ring-(--sp-write)/20",
} as const;

const copy = {
  exam: {
    noun: "đề thi",
    crumb: "Đề thi thử",
    tag: "Bài thi độc lập",
    heading: "Đề thi",
    search: "đề",
    action: "Vào thi",
    done: (count: number) => `Bạn đã thi ${count} lần`,
    none: "Chưa thi lần nào",
    scope: "Trong các lần thi",
    results: "lần thi",
  },
  exercise: {
    noun: "bài tập",
    crumb: "Bài tập",
    tag: "Luyện theo Part",
    heading: "Bài tập",
    search: "bài tập",
    action: "Làm bài",
    done: (count: number) => `Bạn đã làm ${count} lần`,
    none: "Chưa làm lần nào",
    scope: "Trong các lần luyện",
    results: "lần làm",
  },
} as const;

type ExamLibraryKind = keyof typeof copy;

const newestFirst: { value: ExamSort; label: string }[] = [
  { value: "DESC", label: "Mới nhất" },
  { value: "ASC", label: "Cũ nhất" },
];

const difficulties = Object.entries(difficultyLabels) as [
  ExamDifficulty,
  string,
][];

export interface ExamLibrarySkill {
  id: keyof typeof accents;
  name: string;
  tagline: string;
  /** Fixed test format shown beside the result count. */
  format: string;
  maxScore: number;
  /** Targets of the test/exercise switch. */
  examHref: string;
  exerciseHref: string;
}

const field = `min-h-11 rounded-[10px] border border-(--sp-line) bg-white text-[15px] text-(--sp-ink) disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        className={`${field} w-full cursor-pointer appearance-none py-2 pl-4 pr-10`}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-(--sp-ink-2)"
        fill="none"
        height="16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
        width="16"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function ExamCard({
  item,
  skill,
  kind,
}: {
  item: ExamLibraryItem;
  skill: ExamLibrarySkill;
  kind: ExamLibraryKind;
}) {
  const done = item.attemptCount > 0;
  const text = copy[kind];
  const label = `${text.action} ${skill.name}`;
  return (
    <article className="flex flex-col rounded-2xl border border-(--sp-line)/70 bg-white p-5 transition hover:border-(--sp-hero-line) hover:shadow-(--sp-shadow-card)">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-md px-2.5 py-1 text-[13px] ${accents[skill.id]}`}
        >
          {item.badge}
        </span>
        <span className="text-[13px] text-(--sp-ink-2)">
          {done ? "✓ Đã làm" : "Chưa làm"}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-7">{item.title}</h3>
      <p className="mt-3 text-[15px] text-(--sp-ink-2)">{item.meta}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px]">
        <span className="text-(--sp-ink-2)">
          {done ? text.done(item.attemptCount) : text.none}
        </span>
        <span>
          {item.bestScore !== null
            ? `Tốt nhất: ${item.bestScore} / ${skill.maxScore}`
            : "Chưa có kết quả"}
        </span>
      </div>
      <div className="mt-3 flex justify-end">
        {"href" in item.action ? (
          <Link className={primaryAction} href={item.action.href}>
            {label}
          </Link>
        ) : (
          <button
            className={primaryAction}
            disabled={item.action.disabled}
            onClick={item.action.onStart}
            type="button"
          >
            {item.action.starting ? "Đang bắt đầu…" : label}
          </button>
        )}
      </div>
    </article>
  );
}

function ExamPagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  const cell = `min-h-9 min-w-9 rounded-lg border px-3 text-[13px] transition hover:border-(--sp-hero-line) ${focusRing}`;
  const idle = "border-(--sp-line)/70 bg-white text-(--sp-ink-2)";
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-2">
      {page > 1 && (
        <button
          className={`${cell} ${idle}`}
          onClick={() => onPage(page - 1)}
          type="button"
        >
          ← Trước
        </button>
      )}
      {Array.from({ length: pages }, (_, index) => index + 1).map((item) => (
        <button
          aria-current={item === page ? "page" : undefined}
          className={`${cell} ${item === page ? "border-(--sp-hero-line) bg-(--sp-orange-soft) font-semibold text-(--sp-brand)" : idle}`}
          key={item}
          onClick={() => onPage(item)}
          type="button"
        >
          {item}
        </button>
      ))}
      {page < pages && (
        <button
          className={`${cell} ${idle}`}
          onClick={() => onPage(page + 1)}
          type="button"
        >
          Tiếp →
        </button>
      )}
    </nav>
  );
}

/** Test and exercise list page shared by the four skills; filtering and paging run on the loaded list. */
export function ExamLibrary({
  skill,
  kind = "exam",
  header,
  items,
  partLinks,
  sortOptions = newestFirst,
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
}: {
  skill: ExamLibrarySkill;
  kind?: ExamLibraryKind;
  header: ReactNode;
  items: ExamLibraryItem[];
  partLinks?: { href: string; label: string; active: boolean }[];
  /** The first option is the initial order. */
  sortOptions?: { value: ExamSort; label: string }[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ExamStatusFilter>("ALL");
  const [difficulty, setDifficulty] = useState<ExamDifficultyFilter>("ALL");
  const [sort, setSort] = useState<ExamSort>(sortOptions[0].value);
  const [page, setPage] = useState(1);

  const filtered = selectExams(items, { query, status, difficulty, sort });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const first = (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, filtered.length);
  const best = bestExamScore(items);
  const ready = !loading && !error;
  const noTests = items.length === 0;
  const text = copy[kind];
  const hasDifficulty = items.some((item) => item.difficulty !== null);

  return (
    <div className="sp-theme min-h-dvh bg-white">
      {header}
      <main className={`${wideContainer} pb-12 pt-6`}>
        <nav aria-label="Đường dẫn" className="text-[13px] text-(--sp-ink-2)">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link className={`hover:underline ${focusRing}`} href="/">
                Trang chủ
              </Link>{" "}
              /
            </li>
            <li>
              <Link
                className={`hover:underline ${focusRing}`}
                href="/#home-skills"
              >
                {text.crumb}
              </Link>{" "}
              /
            </li>
            <li aria-current="page">{skill.name}</li>
          </ol>
        </nav>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 pt-2.5">
            <p
              className={`w-fit rounded-md px-2.5 py-1 text-xs uppercase ring-1 ring-inset ${accents[skill.id]}`}
            >
              {skill.name} · {text.tag}
            </p>
            <h1 className="mt-3 text-[28px] font-bold leading-9">
              {text.heading} {skill.name}
            </h1>
            <p className="mt-2 text-[15px] text-(--sp-ink-2)">
              {skill.tagline}
            </p>
            <nav
              aria-label={`Chọn đề thi hoặc bài tập ${skill.name}`}
              className="mt-3 inline-flex gap-1 rounded-[10px] border border-(--sp-line)/70 bg-white p-1"
            >
              {(
                [
                  ["exam", "Đề thi thử", skill.examHref],
                  ["exercise", "Bài tập", skill.exerciseHref],
                ] as const
              ).map(([value, label, href]) => (
                <Link
                  aria-current={value === kind ? "page" : undefined}
                  className={`inline-flex min-h-8 items-center rounded-md px-4 text-[13px] transition ${focusRing} ${value === kind ? "bg-(--sp-orange-soft) font-semibold text-(--sp-brand)" : "text-(--sp-ink-2) hover:text-(--sp-ink)"}`}
                  href={href}
                  key={value}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <aside
            aria-label="Thành tích cao nhất"
            className="w-full rounded-2xl border border-(--sp-line)/70 bg-white px-[18px] py-4 sm:w-60"
          >
            <p className="text-xs uppercase text-(--sp-ink-2)">
              Thành tích cao nhất
            </p>
            <p className="mt-1 text-[36px] font-bold leading-[44px] text-[#f4511e]">
              {best ?? "—"} / {skill.maxScore}
            </p>
            <p className="mt-1 text-[13px] text-(--sp-ink-2)">
              {best === null
                ? "Chưa có kết quả"
                : `${text.scope} ${skill.name}`}
            </p>
          </aside>
        </header>

        {partLinks && (
          <nav aria-label="Chọn Part" className="mt-6 flex flex-wrap gap-2">
            {partLinks.map((link) => (
              <Link
                aria-current={link.active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-[10px] border px-4 text-sm transition hover:border-(--sp-hero-line) ${focusRing} ${link.active ? "border-(--sp-hero-line) bg-(--sp-orange-soft) font-semibold text-(--sp-brand)" : "border-(--sp-line)/70 bg-white text-(--sp-ink-2)"}`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div
          className={`${partLinks ? "mt-4" : "mt-6"} flex flex-wrap items-center gap-3`}
        >
          <input
            aria-label={`Tìm kiếm tên ${text.search} ${skill.name}`}
            className={`${field} w-full px-4 placeholder:text-(--sp-ink-2) sm:w-[460px]`}
            disabled={noTests}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={`Tìm kiếm tên ${text.search} ${skill.name}...`}
            type="search"
            value={query}
          />
          <SelectField
            disabled={noTests}
            label="Trạng thái"
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "Trạng thái: Tất cả" },
              { value: "DONE", label: "Trạng thái: Đã làm" },
              { value: "TODO", label: "Trạng thái: Chưa làm" },
            ]}
            value={status}
          />
          {hasDifficulty && (
            <SelectField
              disabled={noTests}
              label="Độ khó"
              onChange={(value) => {
                setDifficulty(value);
                setPage(1);
              }}
              options={[
                { value: "ALL" as const, label: "Độ khó: Tất cả" },
                ...difficulties.map(([value, label]) => ({
                  value,
                  label: `Độ khó: ${label}`,
                })),
              ]}
              value={difficulty}
            />
          )}
          <div className="sm:ml-auto">
            <SelectField
              disabled={noTests}
              label="Sắp xếp"
              onChange={(value) => {
                setSort(value);
                setPage(1);
              }}
              options={sortOptions}
              value={sort}
            />
          </div>
        </div>

        <section aria-labelledby="exam-library-count" className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="text-lg font-semibold" id="exam-library-count">
              {loading
                ? `${text.heading} ${skill.name}`
                : `${filtered.length} ${text.noun} ${skill.name}`}
            </h2>
            <p className="text-[13px] text-(--sp-ink-2)">{skill.format}</p>
          </div>

          {loading && (
            <LoadingPanel label={`Đang tải ${text.noun} ${skill.name}…`} />
          )}
          {error && <ErrorPanel message={error} onRetry={onRetry} />}
          {ready && noTests && (
            <EmptyPanel description={emptyDescription} title={emptyTitle} />
          )}
          {ready && !noTests && filtered.length === 0 && (
            <EmptyPanel
              description="Thử đổi từ khóa hoặc bộ lọc."
              title={`Không tìm thấy ${text.noun} phù hợp`}
            />
          )}
          {!loading && visible.length > 0 && (
            <div className="mt-4 grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => (
                <ExamCard item={item} key={item.id} kind={kind} skill={skill} />
              ))}
            </div>
          )}
        </section>

        {!loading && filtered.length > 0 && (
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-(--sp-ink-2)">
              Hiển thị {first}–{last} trong {filtered.length} {text.noun} · Kết
              quả được lưu riêng theo từng {text.results}
            </p>
            {pages > 1 && (
              <ExamPagination onPage={setPage} page={current} pages={pages} />
            )}
          </footer>
        )}
      </main>
    </div>
  );
}
