"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/features/admin/components/content/admin-page-header";
import {
  adminGradient,
  adminPrimary,
} from "@/features/admin/components/content/admin-styles";
import { AdminStat } from "@/features/admin/components/content/admin-workspace";
import { ContentTabs } from "@/features/admin/components/content/content-tabs";
import {
  archiveSpeakingExercise,
  getSpeakingAdminSummary,
  listSpeakingExercises,
  type SpeakingAdminSummary,
} from "@/features/speaking/admin-api";
import {
  toSpeakingDraft,
  type SpeakingDraft,
} from "@/features/speaking/admin-draft";
import type { Page, SpeakingExercise } from "@/features/speaking/types";
import { AdminLoadState, errorMessage } from "./admin-load-state";
import { SpeakingExerciseEditor } from "./speaking-exercise-editor";
import {
  SpeakingExerciseFilters,
  SpeakingPartTabs,
  type ExerciseFilter,
} from "./speaking-exercise-filters";
import { SpeakingExerciseTable } from "./speaking-exercise-table";
import { TablePagination } from "./table-pagination";

const pageSize = 10;

export function AdminSpeakingContentPage() {
  const [filter, setFilter] = useState<ExerciseFilter>({
    part: 1,
    query: "",
    difficulty: "ALL",
    status: "ALL",
    pageNumber: 1,
  });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<Page<SpeakingExercise> | null>(null);
  const [summary, setSummary] = useState<SpeakingAdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<SpeakingDraft | null>(null);
  const [notice, setNotice] = useState("");

  // Debounce the free-text search so typing does not send a request per key.
  useEffect(() => {
    const task = window.setTimeout(
      () =>
        setFilter((current) =>
          current.query === query
            ? current
            : { ...current, query, pageNumber: 1 },
        ),
      300,
    );
    return () => window.clearTimeout(task);
  }, [query]);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const [nextPage, nextSummary] = await Promise.all([
          listSpeakingExercises(
            {
              part: filter.part,
              query: filter.query.trim() || undefined,
              difficulty:
                filter.difficulty === "ALL" ? undefined : filter.difficulty,
              status: filter.status === "ALL" ? undefined : filter.status,
              pageNumber: filter.pageNumber,
              pageSize,
            },
            signal,
          ),
          getSpeakingAdminSummary(signal),
        ]);
        setPage(nextPage);
        setSummary(nextSummary);
      } catch (cause) {
        if (!signal.aborted)
          setError(errorMessage(cause, "Không thể tải bài tập Speaking."));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [filter],
  );
  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load, revision]);

  const reload = () => setRevision((value) => value + 1);
  const resetPage = (next: Partial<ExerciseFilter>) => {
    if (next.query !== undefined) setQuery(next.query);
    setFilter((current) => ({ ...current, ...next, pageNumber: 1 }));
  };
  const archive = async (exercise: SpeakingExercise) => {
    if (
      !window.confirm(
        `Lưu trữ ${exercise.code}? Đề đã công bố không bị ảnh hưởng.`,
      )
    )
      return;
    try {
      await archiveSpeakingExercise(exercise);
      setNotice(`Đã lưu trữ ${exercise.code}.`);
      reload();
    } catch (cause) {
      setNotice("");
      setError(errorMessage(cause, "Không thể lưu trữ bài tập."));
    }
  };
  const items = page?.items ?? [];

  return (
    <div>
      <AdminPageHeader
        actions={
          <button
            className={adminPrimary}
            onClick={() => setEditor(toSpeakingDraft(undefined, filter.part))}
            style={adminGradient}
            type="button"
          >
            + Thêm bài tập
          </button>
        }
        description="Tạo, tìm kiếm, preview và quản lý bài tập Speaking theo 5 Part."
        title="Ngân hàng bài tập Speaking"
      />
      <ContentTabs section="content" skill="speaking" />
      {notice && <AdminNotice>{notice}</AdminNotice>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          hint="Trên 5 Part"
          label="Tổng bài tập"
          value={summary?.exercises.total ?? "—"}
        />
        <AdminStat
          hint="Có thể chọn khi lắp đề"
          label="Hiển thị"
          value={summary?.exercises.published ?? "—"}
        />
        <AdminStat label="Bản nháp" value={summary?.exercises.draft ?? "—"} />
        <AdminStat label="Lưu trữ" value={summary?.exercises.archived ?? "—"} />
      </div>
      <SpeakingPartTabs
        onChange={(part) => resetPage({ part })}
        value={filter.part}
      />
      <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <SpeakingExerciseFilters
          filter={{ ...filter, query }}
          onChange={resetPage}
        />
        <AdminLoadState
          error={error}
          loading={loading && !page}
          onRetry={reload}
        />
        {!error && page && items.length > 0 && (
          <SpeakingExerciseTable
            items={items}
            onArchive={(exercise) => void archive(exercise)}
            onEdit={(exercise) => setEditor(toSpeakingDraft(exercise))}
          />
        )}
        {!error && page && items.length === 0 && (
          <div className="p-14 text-center">
            <b>Không tìm thấy bài tập phù hợp</b>
            <button
              className="ml-3 text-sm font-bold text-[var(--admin-brand-red)] underline"
              onClick={() =>
                resetPage({ query: "", difficulty: "ALL", status: "ALL" })
              }
              type="button"
            >
              Xóa lọc
            </button>
          </div>
        )}
        <TablePagination
          onPage={(pageNumber) =>
            setFilter((current) => ({ ...current, pageNumber }))
          }
          page={page?.pageNumber ?? 1}
          pages={Math.max(1, page?.totalPages ?? 1)}
          total={page?.totalCount ?? 0}
          unit="bài tập"
        />
      </section>
      {editor && (
        <SpeakingExerciseEditor
          initial={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setNotice("Đã lưu bài tập Speaking.");
            reload();
          }}
        />
      )}
    </div>
  );
}
