"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminDifficulty } from "@/features/admin/components/content/admin-badges";
import { AdminFilterSelect } from "@/features/admin/components/content/admin-filters";
import {
  getSpeakingExercises,
  type SpeakingExerciseSummary,
} from "@/features/speaking/api";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import {
  speakingParts,
  type SpeakingDifficulty,
  type SpeakingPart,
} from "@/features/speaking/types";
import { formatMinutes } from "@/shared/ui/format-time";
import { FilterPills, SearchField } from "./ui/filters";
import { ArrowRightIcon } from "./ui/icons";
import { SpPage } from "./ui/page";
import { Pagination } from "./ui/pagination";
import { SpEmpty, SpError, SpLoading } from "./ui/primitives";

const pageSize = 8;

const unique = (values: number[]) =>
  [...new Set(values)].map((value) => `${value}s`).join(" / ");

/** Published exercises of one Part; each can be practised on its own. */
export function SpeakingPartLibrary({ part }: { part: SpeakingPart }) {
  const spec = speakingPartSpecs[part];
  const [lists, setLists] = useState<SpeakingExerciseSummary[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("ALL");
  const [difficulty, setDifficulty] = useState<"ALL" | SpeakingDifficulty>(
    "ALL",
  );
  const [page, setPage] = useState(1);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setLists(
        await Promise.all(
          speakingParts.map((item) => getSpeakingExercises(item, signal)),
        ),
      );
    } catch (cause) {
      if (signal?.aborted) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải bài tập Speaking.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load]);

  const exercises = lists[part - 1] ?? [];
  const topics = [...new Set(exercises.map((item) => item.topic))];
  const needle = query.trim().toLocaleLowerCase("vi-VN");
  const filtered = exercises.filter(
    (item) =>
      `${item.code} ${item.topic}`
        .toLocaleLowerCase("vi-VN")
        .includes(needle) &&
      (topic === "ALL" || item.topic === topic) &&
      (difficulty === "ALL" || item.difficulty === difficulty),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const offset = (current - 1) * pageSize;
  const resetting =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };
  const stats = [
    ...(spec.readingSeconds
      ? [{ value: `${spec.readingSeconds}s`, label: "Đọc tài liệu" }]
      : []),
    { value: unique(spec.preparationSeconds), label: "Chuẩn bị" },
    { value: unique(spec.responseSeconds), label: "Trả lời" },
    { value: lists.length ? String(exercises.length) : "…", label: "Bài tập" },
  ];

  return (
    <SpPage>
      <section className="relative overflow-hidden rounded-[20px] bg-(--sp-ink) text-white">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 right-4 text-[260px] font-extrabold leading-none text-white/[0.06]"
        >
          {part}
        </span>
        <div className="relative p-8 md:p-10">
          <p className="sp-overline text-(--sp-amber)">
            SPEAKING · PART {part} / 5
          </p>
          <h1 className="mt-2 text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[52px]">
            {spec.title}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-white/70">
            {spec.description}
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="text-2xl font-bold">{stat.value}</dd>
                <dt className="text-[13px] text-white/60">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <nav
          aria-label="Chọn Part"
          className="relative grid grid-cols-5 border-t border-white/15"
        >
          {speakingParts.map((item) => {
            const active = item === part;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`sp-focus border-r border-white/15 px-3 py-3.5 text-center text-sm last:border-r-0 md:text-left md:px-6 ${active ? "bg-(--sp-brand) font-semibold" : "text-white/70 hover:bg-white/10"}`}
                href={`/speaking/parts/${item}`}
                key={item}
              >
                <span className="md:hidden">{item}</span>
                <span className="hidden md:inline">
                  {item}. {speakingPartSpecs[item].subtitle}
                </span>
              </Link>
            );
          })}
        </nav>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchField
          label="Tìm bài tập"
          onChange={resetting(setQuery)}
          placeholder="Tìm theo mã bài hoặc chủ đề…"
          suggestions={exercises.map((item) => ({
            value: item.code,
            label: item.topic,
            hint: item.code,
          }))}
          value={query}
        />
        <FilterPills
          label="Độ khó"
          onChange={resetting(setDifficulty)}
          options={[
            { value: "ALL", label: "Tất cả" },
            { value: "EASY", label: "Dễ" },
            { value: "MEDIUM", label: "Trung bình" },
            { value: "HARD", label: "Khó" },
          ]}
          value={difficulty}
        />
        {topics.length > 1 && (
          <AdminFilterSelect
            allValue="ALL"
            ariaLabel="Chủ đề"
            label="Chủ đề"
            onChange={resetting(setTopic)}
            options={topics.map((item) => ({ value: item, label: item }))}
            value={topic}
          />
        )}
      </div>

      <div className="mt-4">
        {loading && <SpLoading label="Đang tải bài tập…" />}
        {error && <SpError message={error} onRetry={() => void load()} />}
        {!loading && !error && filtered.length === 0 && (
          <SpEmpty
            description="Thử đổi từ khóa hoặc bộ lọc."
            title={`Chưa có bài tập phù hợp ở Part ${part}`}
          />
        )}
        {visible.length > 0 && (
          <ul className="sp-card divide-y divide-(--sp-line) overflow-hidden">
            {visible.map((exercise, index) => (
              <li key={exercise.id}>
                <Link
                  className="sp-focus group flex flex-wrap items-center gap-x-6 gap-y-1 px-6 py-4 transition hover:bg-(--sp-cream)"
                  href={`/speaking/exercises/${encodeURIComponent(exercise.id)}/practice`}
                >
                  <span className="w-10 text-2xl font-extrabold text-(--sp-ink-3)">
                    {String(offset + index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-52 flex-1">
                    <span className="block text-lg font-semibold">
                      {exercise.topic}
                    </span>
                    <span className="text-xs text-(--sp-ink-3)">
                      {exercise.code}
                    </span>
                  </span>
                  <span className="w-28">
                    <AdminDifficulty value={exercise.difficulty} />
                  </span>
                  <span className="w-24 text-[13px] text-(--sp-ink-2)">
                    {formatMinutes(exercise.durationSeconds)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--sp-brand)">
                    Luyện
                    <ArrowRightIcon
                      className="transition group-hover:translate-x-1"
                      size={16}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {filtered.length > pageSize && (
        <div className="mt-5 flex justify-end">
          <Pagination onPage={setPage} page={current} pages={pages} />
        </div>
      )}
    </SpPage>
  );
}
