"use client";

import { useEffect, useState } from "react";
import { toast } from "@/shared/ui/toast";
import { deleteKnowledgeCategory, listKnowledgeCategories } from "../admin-api";
import { KnowledgeApiError } from "../http";
import { formatDateTimeVi } from "../tiptap-utils";
import type { KnowledgeCategory, PageResult } from "../types";
import {
  KnowledgeConfirmDialog,
  KnowledgePagination,
} from "./knowledge-ui-primitives";

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
  const [confirmDeleteCat, setConfirmDeleteCat] =
    useState<KnowledgeCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function confirmDelete() {
    if (!confirmDeleteCat) return;
    setDeleting(true);
    try {
      await deleteKnowledgeCategory(
        confirmDeleteCat.id,
        confirmDeleteCat.version,
      );
      toast.success("Đã xóa danh mục.");
      setConfirmDeleteCat(null);
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể xóa danh mục.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const fieldClass =
    "h-10 rounded-xl border border-(--admin-border) bg-white px-3 text-sm text-(--admin-ink) outline-none transition focus:border-(--admin-brand-orange) focus:ring-4 focus:ring-orange-100";

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-(--admin-border) bg-(--admin-surface) p-4 sm:grid-cols-3">
        <input
          className={fieldClass}
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
          className={fieldClass}
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
          className={fieldClass}
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

      <div className="overflow-hidden rounded-2xl border border-(--admin-border) bg-(--admin-surface) shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-(--admin-muted)">
            Đang tải danh mục...
          </p>
        ) : !data || data.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--admin-muted)">
            Chưa có danh mục nào. Hãy bấm &quot;+ Tạo danh mục mới&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-(--admin-border) bg-(--admin-surface-muted) text-xs font-bold uppercase text-(--admin-muted)">
                <tr>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Thứ tự</th>
                  <th className="px-4 py-3">Số bài viết</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--admin-border)">
                {data.items.map((cat) => (
                  <tr className="hover:bg-(--admin-row-hover)" key={cat.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-(--admin-ink)">
                        {cat.name}
                      </p>
                      <p className="text-xs text-(--admin-muted)">
                        /{cat.slug}
                        {cat.description ? ` - ${cat.description}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-(--admin-ink)">
                      {cat.displayOrder}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-(--admin-ink)">
                      {cat.articleCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-(--admin-muted)">
                      {formatDateTimeVi(cat.updatedAtUtc)}
                    </td>
                    <td aria-label="Thao tác" className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2.5 py-1 text-xs font-semibold text-(--admin-ink) transition duration-150 hover:border-(--admin-brand-orange) hover:bg-(--admin-row-hover) hover:text-(--admin-brand-red) hover:shadow-xs active:scale-95"
                          onClick={() => onEdit(cat)}
                          type="button"
                        >
                          Sửa
                        </button>
                        <button
                          className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2.5 py-1 text-xs font-medium text-(--admin-danger) transition duration-150 hover:border-(--admin-danger) hover:bg-(--admin-danger) hover:text-white hover:shadow-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--admin-border) disabled:hover:bg-white disabled:hover:text-(--admin-danger) disabled:hover:shadow-none"
                          disabled={cat.articleCount > 0}
                          onClick={() => setConfirmDeleteCat(cat)}
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

      <KnowledgeConfirmDialog
        confirmLabel="Xóa danh mục"
        description={`Bạn có chắc chắn muốn xóa danh mục "${confirmDeleteCat?.name ?? ""}"?`}
        onCancel={() => setConfirmDeleteCat(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(confirmDeleteCat)}
        pending={deleting}
        title="Xác nhận xóa danh mục"
      />
    </section>
  );
}
