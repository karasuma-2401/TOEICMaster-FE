"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/shared/ui/toast";
import {
  archiveKnowledgeArticle,
  deleteKnowledgeArticle,
  listKnowledgeArticles,
  publishKnowledgeArticle,
  toAdminBffMediaUrl,
  unpublishKnowledgeArticle,
} from "../admin-api";
import { KnowledgeApiError } from "../http";
import { formatDateTimeVi } from "../tiptap-utils";
import {
  KNOWLEDGE_SKILLS,
  KNOWLEDGE_STATUSES,
  type KnowledgeArticleSummary,
  type KnowledgeCategory,
  type PageResult,
} from "../types";
import {
  KnowledgePagination,
  KnowledgeStatusBadge,
} from "./knowledge-ui-primitives";

interface KnowledgeArticlesTabProps {
  categories: KnowledgeCategory[];
}

export function KnowledgeArticlesTab({
  categories,
}: KnowledgeArticlesTabProps) {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("updatedAt:desc");
  const [pageNumber, setPageNumber] = useState(1);
  const [data, setData] = useState<PageResult<KnowledgeArticleSummary> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function run() {
      try {
        const page = await listKnowledgeArticles(
          {
            query: query.trim() || undefined,
            skill: skill || undefined,
            categoryId: categoryId || undefined,
            status: status || undefined,
            sort,
            pageNumber,
            pageSize: 12,
          },
          controller.signal,
        );
        if (active) setData(page);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        toast.error(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách bài viết.",
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
  }, [categoryId, pageNumber, query, skill, sort, status, tick]);

  async function handleAction(
    article: KnowledgeArticleSummary,
    action: "publish" | "unpublish" | "archive" | "delete",
  ) {
    if (
      action === "delete" &&
      !window.confirm(`Xóa vĩnh viễn bài viết "${article.title}"?`)
    ) {
      return;
    }
    try {
      if (action === "publish") {
        await publishKnowledgeArticle(article.id, article.version);
        toast.success("Đã xuất bản bài viết.");
      } else if (action === "unpublish") {
        await unpublishKnowledgeArticle(article.id, article.version);
        toast.success("Đã gỡ bài viết về bản nháp.");
      } else if (action === "archive") {
        await archiveKnowledgeArticle(article.id, article.version);
        toast.success("Đã chuyển bài viết sang lưu trữ.");
      } else {
        await deleteKnowledgeArticle(article.id, article.version);
        toast.success("Đã xóa bài viết.");
      }
      setTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể thực hiện thao tác.",
      );
    }
  }

  const fieldClass =
    "h-10 rounded-xl border border-(--admin-border) bg-white px-3 text-sm text-(--admin-ink) outline-none transition focus:border-(--admin-brand-orange) focus:ring-4 focus:ring-orange-100";

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-(--admin-border) bg-(--admin-surface) p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          className={fieldClass}
          onChange={(e) => {
            setQuery(e.target.value);
            setPageNumber(1);
          }}
          placeholder="Tìm theo tiêu đề bài viết..."
          type="search"
          value={query}
        />
        <select
          aria-label="Lọc theo kỹ năng"
          className={fieldClass}
          onChange={(e) => {
            setSkill(e.target.value);
            setPageNumber(1);
          }}
          value={skill}
        >
          <option value="">Tất cả kỹ năng</option>
          {KNOWLEDGE_SKILLS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc theo danh mục"
          className={fieldClass}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPageNumber(1);
          }}
          value={categoryId}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc theo trạng thái"
          className={fieldClass}
          onChange={(e) => {
            setStatus(e.target.value);
            setPageNumber(1);
          }}
          value={status}
        >
          <option value="">Tất cả trạng thái</option>
          {KNOWLEDGE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sắp xếp bài viết"
          className={fieldClass}
          onChange={(e) => {
            setSort(e.target.value);
            setPageNumber(1);
          }}
          value={sort}
        >
          <option value="updatedAt:desc">Mới cập nhật</option>
          <option value="publishedAt:desc">Mới xuất bản</option>
          <option value="createdAt:desc">Mới tạo</option>
          <option value="title:asc">Tiêu đề A → Z</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-(--admin-border) bg-(--admin-surface) shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-(--admin-muted)">
            Đang tải danh sách bài viết...
          </p>
        ) : !data || data.items.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-(--admin-muted)">
              Chưa có bài viết nào khớp với bộ lọc hiện tại.
            </p>
            <Link
              className="admin-primary-action mt-3 inline-flex rounded-lg px-4 py-2 text-sm font-bold"
              href="/admin/knowledge/new"
            >
              + Viết bài kiến thức đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-(--admin-border) bg-(--admin-surface-muted) text-xs font-bold uppercase text-(--admin-muted)">
                <tr>
                  <th className="px-4 py-3">Bài viết</th>
                  <th className="px-4 py-3">Phân loại</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--admin-border)">
                {data.items.map((article) => (
                  <tr className="hover:bg-(--admin-row-hover)" key={article.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {article.coverImageAssetId ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            alt={article.coverImageAlt || article.title}
                            className="h-12 w-16 shrink-0 rounded-lg border border-(--admin-border) object-cover"
                            src={toAdminBffMediaUrl(article.coverImageAssetId)}
                          />
                        ) : (
                          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-(--admin-border) bg-(--admin-surface-muted) text-[10px] text-(--admin-muted)">
                            Không ảnh
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            className="block truncate font-semibold text-(--admin-ink) hover:text-(--admin-brand-red)"
                            href={`/admin/knowledge/${article.id}`}
                          >
                            {article.title}
                          </Link>
                          <p className="truncate text-xs text-(--admin-muted)">
                            /{article.slug} · {article.estimatedReadMinutes}{" "}
                            phút đọc
                          </p>
                        </div>
                      </div>
                    </td>
                    <td aria-label="Phân loại" className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit rounded-md bg-(--admin-nav-active) px-2 py-0.5 text-xs font-semibold text-(--admin-brand-red)">
                          {article.skill}
                        </span>
                        <span className="text-xs text-(--admin-ink-soft)">
                          {article.categoryName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <KnowledgeStatusBadge status={article.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-(--admin-muted)">
                      {formatDateTimeVi(article.updatedAtUtc)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <Link
                          className="rounded-md border border-(--admin-border) bg-white px-2.5 py-1 text-xs font-semibold text-(--admin-ink) hover:bg-(--admin-surface-muted)"
                          href={`/admin/knowledge/${article.id}`}
                        >
                          Sửa
                        </Link>
                        {article.status !== "Published" ? (
                          <button
                            className="rounded-md bg-(--admin-success-soft) px-2.5 py-1 text-xs font-semibold text-(--admin-success) hover:opacity-85"
                            onClick={() =>
                              void handleAction(article, "publish")
                            }
                            type="button"
                          >
                            Xuất bản
                          </button>
                        ) : (
                          <button
                            className="rounded-md bg-(--admin-warning-soft) px-2.5 py-1 text-xs font-semibold text-(--admin-warning) hover:opacity-85"
                            onClick={() =>
                              void handleAction(article, "unpublish")
                            }
                            type="button"
                          >
                            Gỡ
                          </button>
                        )}
                        {article.status !== "Archived" ? (
                          <button
                            className="rounded-md border border-(--admin-border) px-2.5 py-1 text-xs text-(--admin-ink-soft) hover:bg-(--admin-surface-muted)"
                            onClick={() =>
                              void handleAction(article, "archive")
                            }
                            type="button"
                          >
                            Lưu trữ
                          </button>
                        ) : null}
                        <button
                          className="rounded-md border border-(--admin-border) px-2.5 py-1 text-xs text-(--admin-danger) hover:bg-(--admin-danger-soft) disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={article.status === "Published"}
                          onClick={() => void handleAction(article, "delete")}
                          title={
                            article.status === "Published"
                              ? "Cần gỡ bài viết khỏi trạng thái xuất bản trước khi xóa"
                              : "Xóa bài viết"
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
            itemLabel="bài viết"
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
