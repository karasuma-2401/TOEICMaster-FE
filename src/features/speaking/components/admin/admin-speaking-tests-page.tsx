"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/features/admin/components/content/admin-page-header";
import { ContentTabs } from "@/features/admin/components/content/content-tabs";
import { listSpeakingTests } from "@/features/speaking/admin-api";
import type { SpeakingTestListItem } from "@/features/speaking/parsers";
import type { Page, SpeakingTestStatus } from "@/features/speaking/types";
import { Chip } from "../ui/primitives";
import { AdminLoadState, errorMessage } from "./admin-load-state";
import { CreateTestModal } from "./create-test-modal";
import { SpeakingTestWorkspace } from "./speaking-test-workspace";
import { SpeakingTestsTable } from "./speaking-tests-table";
import { TablePagination } from "./table-pagination";

const pageSize = 20;

export function AdminSpeakingTestsPage() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SpeakingTestStatus | "ALL">("ALL");
  const [pageNumber, setPageNumber] = useState(1);
  const [page, setPage] = useState<Page<SpeakingTestListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  /** `undefined` = closed, `null` = new test, string = existing test id. */
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [creating, setCreating] = useState(false);
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
        setPage(
          await listSpeakingTests(
            {
              query: search || undefined,
              status: status === "ALL" ? undefined : status,
              pageNumber,
              pageSize,
            },
            signal,
          ),
        );
      } catch (cause) {
        if (!signal.aborted)
          setError(errorMessage(cause, "Không thể tải đề Speaking."));
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
      <h1 className="text-[32px] font-semibold leading-10">Kho dữ liệu</h1>
      <p className="mb-4 text-(--sp-ink-2)">
        Quản lý ngân hàng bài tập và đề thi TOEIC trong hệ thống.
      </p>
      <ContentTabs section="tests" skill="speaking" />
      <div className="flex justify-end">
        <button
          className="sp-btn sp-btn-cta"
          onClick={() => setCreating(true)}
          type="button"
        >
          + Tạo đề Speaking mới
        </button>
      </div>
      {notice && <AdminNotice>{notice}</AdminNotice>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[22px] font-semibold">Danh sách đề Speaking</h2>
        <Chip tone="speak">11 câu · ~20 phút · Thang 200</Chip>
      </div>
      <section className="sp-card mt-3 overflow-hidden">
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_14rem]">
          <input
            aria-label="Tìm đề Speaking"
            className="sp-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm tên đề Speaking…"
            value={query}
          />
          <select
            aria-label="Lọc trạng thái đề"
            className="sp-input"
            onChange={(event) => {
              setStatus(event.target.value as SpeakingTestStatus | "ALL");
              setPageNumber(1);
            }}
            value={status}
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="PUBLISHED">Chính thức</option>
            <option value="DRAFT">Bản nháp</option>
          </select>
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
          <p className="p-14 text-center font-semibold">
            Không tìm thấy đề phù hợp
          </p>
        )}
        <TablePagination
          onPage={setPageNumber}
          page={page?.pageNumber ?? 1}
          pages={Math.max(1, page?.totalPages ?? 1)}
          total={page?.totalCount ?? 0}
          unit="đề Speaking"
        />
      </section>
      {creating && (
        <CreateTestModal
          onClose={() => setCreating(false)}
          onCreated={(testId) => {
            setCreating(false);
            setEditing(testId);
            reload();
          }}
        />
      )}
      {editing !== undefined && (
        <SpeakingTestWorkspace
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            setEditing(undefined);
            setNotice(message);
            reload();
          }}
          testId={editing}
        />
      )}
    </div>
  );
}
