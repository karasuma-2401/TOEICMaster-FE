"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  deleteKnowledgeMedia,
  listKnowledgeMedia,
  toAdminBffMediaUrl,
} from "../admin-api";
import { KnowledgeApiError } from "../http";
import { formatBytes } from "../tiptap-utils";
import type { KnowledgeMediaAsset, PageResult } from "../types";
import { KnowledgePagination } from "./knowledge-ui-primitives";

interface KnowledgeMediaTabProps {
  refreshSignal: number;
}

export function KnowledgeMediaTab({ refreshSignal }: KnowledgeMediaTabProps) {
  const [query, setQuery] = useState("");
  const [unusedOnly, setUnusedOnly] = useState("all");
  const [sort, setSort] = useState("createdAt:desc");
  const [pageNumber, setPageNumber] = useState(1);
  const [data, setData] = useState<PageResult<KnowledgeMediaAsset> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [localTick, setLocalTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function run() {
      try {
        const page = await listKnowledgeMedia(
          {
            query: query.trim() || undefined,
            unusedOnly:
              unusedOnly === "unused"
                ? true
                : unusedOnly === "used"
                  ? false
                  : undefined,
            sort,
            pageNumber,
            pageSize: 16,
          },
          controller.signal,
        );
        if (active) setData(page);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        toast.error(
          err instanceof Error ? err.message : "Không thể tải thư viện ảnh.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [localTick, pageNumber, query, refreshSignal, sort, unusedOnly]);

  async function handleDelete(asset: KnowledgeMediaAsset) {
    if (!window.confirm(`Xóa hình ảnh "${asset.originalFileName}"?`)) return;
    try {
      await deleteKnowledgeMedia(asset.id);
      toast.success("Đã xóa hình ảnh.");
      setLocalTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể xóa hình ảnh.",
      );
    }
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-(--sp-line) bg-(--sp-surface) p-4 sm:grid-cols-3">
        <input
          className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm outline-none focus:border-(--sp-brand)"
          onChange={(e) => {
            setQuery(e.target.value);
            setPageNumber(1);
          }}
          placeholder="Tìm theo tên file ảnh..."
          type="search"
          value={query}
        />
        <select
          aria-label="Lọc ảnh theo trạng thái sử dụng"
          className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
          onChange={(e) => {
            setUnusedOnly(e.target.value);
            setPageNumber(1);
          }}
          value={unusedOnly}
        >
          <option value="all">Tất cả hình ảnh</option>
          <option value="used">Đang được dùng trong bài</option>
          <option value="unused">Chưa được dùng (có thể xóa)</option>
        </select>
        <select
          aria-label="Sắp xếp hình ảnh"
          className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
          onChange={(e) => {
            setSort(e.target.value);
            setPageNumber(1);
          }}
          value={sort}
        >
          <option value="createdAt:desc">Mới tải lên</option>
          <option value="fileName:asc">Tên file A → Z</option>
          <option value="byteLength:desc">Dung lượng lớn nhất</option>
        </select>
      </div>

      <div className="rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-5 shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-(--sp-ink-2)">
            Đang tải thư viện ảnh...
          </p>
        ) : !data || data.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--sp-ink-2)">
            Chưa có hình ảnh nào.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((asset) => {
              const used = (asset.usageCount ?? 0) > 0;
              return (
                <div
                  className="flex flex-col overflow-hidden rounded-xl border border-(--sp-line) bg-white"
                  key={asset.id}
                >
                  <div className="aspect-4/3 w-full overflow-hidden bg-(--sp-subtle)">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={asset.originalFileName}
                      className="h-full w-full object-cover"
                      src={toAdminBffMediaUrl(asset.id)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-2 p-3">
                    <div>
                      <p
                        className="truncate text-xs font-semibold text-(--sp-ink)"
                        title={asset.originalFileName}
                      >
                        {asset.originalFileName}
                      </p>
                      <p className="text-[11px] text-(--sp-ink-3)">
                        {formatBytes(asset.byteLength)} ·{" "}
                        {used
                          ? `Đang dùng (${asset.usageCount} bài)`
                          : "Chưa dùng"}
                      </p>
                    </div>
                    <button
                      className="w-full rounded-md border border-(--sp-line) py-1 text-xs font-semibold text-(--sp-danger) hover:bg-(--sp-danger-bg) disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={used}
                      onClick={() => void handleDelete(asset)}
                      title={
                        used
                          ? "Ảnh đang được sử dụng trong bài viết"
                          : "Xóa ảnh khỏi thư viện"
                      }
                      type="button"
                    >
                      {used ? "Đang sử dụng" : "Xóa ảnh"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data ? (
          <KnowledgePagination
            className="mt-5 border-t border-(--sp-line) pt-3"
            hasNextPage={data.hasNextPage}
            hasPreviousPage={data.hasPreviousPage}
            itemLabel="ảnh"
            onPageChange={setPageNumber}
            pageNumber={data.pageNumber}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
          />
        ) : null}
      </div>
    </section>
  );
}
