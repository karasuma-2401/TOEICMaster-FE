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
  getSpeakingAdminSummary,
  listSpeakingTests,
  type SpeakingAdminSummary,
} from "@/features/speaking/admin-api";
import type { SpeakingTestListItem } from "@/features/speaking/parsers";
import type { Page, SpeakingTestStatus } from "@/features/speaking/types";
import { AdminLoadState, errorMessage } from "./admin-load-state";
import { SpeakingTestWorkspace } from "./speaking-test-workspace";
import { SpeakingTestsTable } from "./speaking-tests-table";
import { TablePagination } from "./table-pagination";

const control =
  "h-11 rounded-xl border border-[var(--admin-border)] bg-white px-3 text-sm";
const pageSize = 20;

export function AdminSpeakingTestsPage() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SpeakingTestStatus | "ALL">("ALL");
  const [pageNumber, setPageNumber] = useState(1);
  const [page, setPage] = useState<Page<SpeakingTestListItem> | null>(null);
  const [summary, setSummary] = useState<SpeakingAdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  /** `undefined` = closed, `null` = new test, string = existing test id. */
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const task = window.setTimeout(() => {
      setSearch(query.trim());
      setPageNumber(1);
    }, 300);
    return () => window.clearTimeout(task);
  }, [query]);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const [nextPage, nextSummary] = await Promise.all([
          listSpeakingTests(
            {
              query: search || undefined,
              status: status === "ALL" ? undefined : status,
              pageNumber,
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
          setError(errorMessage(cause, "Unable to load Speaking tests."));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [pageNumber, search, status],
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
  const items = page?.items ?? [];

  return (
    <div>
      <AdminPageHeader
        actions={
          <button
            className={adminPrimary}
            onClick={() => setEditing(null)}
            style={adminGradient}
            type="button"
          >
            + Create Speaking test
          </button>
        }
        description="Author all 11 questions across 5 Parts directly and verify publish requirements."
        title="Speaking Tests"
      />
      <ContentTabs section="tests" skill="speaking" />
      {notice && <AdminNotice>{notice}</AdminNotice>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Total tests" value={summary?.tests.total ?? "-"} />
        <AdminStat
          hint="Visible to learners"
          label="Published"
          value={summary?.tests.published ?? "-"}
        />
        <AdminStat label="Drafts" value={summary?.tests.draft ?? "-"} />
        <AdminStat
          hint="Only for legacy tests using the exercise bank"
          label="Published exercises"
          value={summary?.exercises.published ?? "-"}
        />
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="grid gap-3 border-b border-[var(--admin-border)] p-4 md:grid-cols-[1fr_12rem_auto] md:items-center">
          <input
            aria-label="Search Speaking tests"
            className={control}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by test code or title..."
            value={query}
          />
          <select
            aria-label="Filter test status"
            className={control}
            onChange={(event) => {
              setStatus(event.target.value as SpeakingTestStatus | "ALL");
              setPageNumber(1);
            }}
            value={status}
          >
            <option value="ALL">Status: All</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
          <p className="text-right text-xs font-semibold text-[var(--admin-muted)]">
            {page ? `${page.totalCount} tests` : ""}
          </p>
        </div>
        <AdminLoadState
          error={error}
          loading={loading && !page}
          onRetry={reload}
        />
        {!error && page && items.length > 0 && (
          <SpeakingTestsTable
            onOpen={(test) => setEditing(test.id)}
            tests={items}
          />
        )}
        {!error && page && items.length === 0 && (
          <p className="p-14 text-center font-bold">No matching tests found</p>
        )}
        <TablePagination
          onPage={setPageNumber}
          page={page?.pageNumber ?? 1}
          pages={Math.max(1, page?.totalPages ?? 1)}
          total={page?.totalCount ?? 0}
          unit="tests"
        />
      </section>
      {editing !== undefined && (
        <SpeakingTestWorkspace
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            setNotice(message);
            reload();
          }}
          testId={editing}
        />
      )}
    </div>
  );
}
