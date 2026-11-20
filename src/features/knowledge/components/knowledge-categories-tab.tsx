"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { deleteKnowledgeCategory, listKnowledgeCategories } from "../admin-api";
import { KnowledgeApiError } from "../http";
import { formatDateTimeVi } from "../tiptap-utils";
import type { KnowledgeCategory, PageResult } from "../types";
import { KnowledgePagination } from "./knowledge-ui-primitives";

interface KnowledgeCategoriesTabProps {
  refreshSignal: number;
  onEdit: (category: KnowledgeCategory) => void;
  onChanged: () => void;
}

export function KnowledgeCategoriesTab({
  refreshSignal,
  onEdit,
  onChanged,
}: KnowledgeCategoriesTabProps) {
  const [query, setQuery] = useState("");
  const [hasArticles, setHasArticles] = useState("all");
  const [sort, setSort] = useState("displayOrder:asc");
  const [pageNumber, setPageNumber] = useState(1);
  const [data, setData] = useState<PageResult<KnowledgeCategory> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function run() {
      try {
        const page = await listKnowledgeCategories(
          {
            query: query.trim() || undefined,
            hasArticles:
              hasArticles === "yes"
                ? true
                : hasArticles === "no"
                  ? false
                  : undefined,
            sort,
            pageNumber,
            pageSize: 15,
          },
          controller.signal,
        );
        if (active) setData(page);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        toast.error(
          err instanceof Error ? err.message : "Không thể tải danh mục.",
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
  }, [hasArticles, pageNumber, query, refreshSignal, sort]);

  async function handleDelete(cat: KnowledgeCategory) {
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    try {
      await deleteKnowledgeCategory(cat.id, cat.version);
      toast.success("Đã xóa danh mục.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể xóa danh mục.",
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
          placeholder="Tìm theo tên hoặc slug danh mục..."
          type="search"
          value={query}
        />
        <select
          aria-label="Lọc danh mục theo bài viết"
          className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
          onChange={(e) => {
            setHasArticles(e.target.value);
            setPageNumber(1);
          }}
          value={hasArticles}
        >
          <option value="all">Tất cả danh mục</option>
          <option value="yes">Đang có bài viết</option>
          <option value="no">Danh mục trống</option>
        </select>
        <select
          aria-label="Sắp xếp danh mục"
          className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
          onChange={(e) => {
            setSort(e.target.value);
            setPageNumber(1);
          }}
          value={sort}
        >
          <option value="displayOrder:asc">Thứ tự hiển thị (tăng)</option>
          <option value="name:asc">Tên A → Z</option>
          <option value="updatedAt:desc">Mới cập nhật</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-(--sp-line) bg-(--sp-surface) shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-(--sp-ink-2)">
            Đang tải danh mục...
          </p>
        ) : !data || data.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--sp-ink-2)">
            Chưa có danh mục nào. Hãy bấm &quot;+ Tạo danh mục mới&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-(--sp-line) bg-(--sp-subtle) text-xs font-bold uppercase text-(--sp-ink-2)">
                <tr>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Thứ tự</th>
                  <th className="px-4 py-3">Số bài viết</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--sp-line)">
                {data.items.map((cat) => (
                  <tr className="hover:bg-(--sp-row-hover)" key={cat.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-(--sp-ink)">
                        {cat.name}
                      </p>
                      <p className="text-xs text-(--sp-ink-3)">
                        /{cat.slug}
                        {cat.description ? ` · ${cat.description}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {cat.displayOrder}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {cat.articleCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-(--sp-ink-2)">
                      {formatDateTimeVi(cat.updatedAtUtc)}
                    </td>
                    <td aria-label="Thao tác" className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          className="rounded-md border border-(--sp-line) bg-white px-2.5 py-1 text-xs font-semibold text-(--sp-ink) hover:bg-(--sp-subtle)"
                          onClick={() => onEdit(cat)}
                          type="button"
                        >
                          Sửa
                        </button>
                        <button
                          className="rounded-md border border-(--sp-line) px-2.5 py-1 text-xs text-(--sp-danger) hover:bg-(--sp-danger-bg) disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={cat.articleCount > 0}
                          onClick={() => void handleDelete(cat)}
                          title={
                            cat.articleCount > 0
                              ? "Không thể xóa danh mục đang có bài viết"
                              : "Xóa danh mục"
                          }
                          type="button"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data ? (
          <KnowledgePagination
            hasNextPage={data.hasNextPage}
            hasPreviousPage={data.hasPreviousPage}
            itemLabel="danh mục"
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
