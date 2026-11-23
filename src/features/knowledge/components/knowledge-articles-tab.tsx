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
  KnowledgeConfirmDialog,
  KnowledgePagination,
  KnowledgeStatusBadge,
} from "./knowledge-ui-primitives";

interface KnowledgeArticlesTabProps {
  categories: KnowledgeCategory[];
}

function ActionIcon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.85}
      viewBox="0 0 24 24"
    >
      <path d={d} />
    </svg>
  );
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
  const [confirmDeleteArticle, setConfirmDeleteArticle] =
    useState<KnowledgeArticleSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

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
          err instanceof Error ? err.message : "Could not load articles.",
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
    if (action === "delete") {
      setConfirmDeleteArticle(article);
      return;
    }
    try {
      if (action === "publish") {
        await publishKnowledgeArticle(article.id, article.version);
        toast.success("Article published.");
      } else if (action === "unpublish") {
        await unpublishKnowledgeArticle(article.id, article.version);
        toast.success("Article unpublished to draft.");
      } else if (action === "archive") {
        await archiveKnowledgeArticle(article.id, article.version);
        toast.success("Article archived.");
      }
      setTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Could not complete the action.",
      );
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteArticle) return;
    setDeleting(true);
    try {
      await deleteKnowledgeArticle(
        confirmDeleteArticle.id,
        confirmDeleteArticle.version,
      );
      toast.success("Article deleted.");
      setConfirmDeleteArticle(null);
      setTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Could not delete article.",
      );
    } finally {
      setDeleting(false);
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
          placeholder="Search by article title..."
          type="search"
          value={query}
        />
        <select
          aria-label="Filter by skill"
          className={fieldClass}
          onChange={(e) => {
            setSkill(e.target.value);
            setPageNumber(1);
          }}
          value={skill}
        >
          <option value="">All skills</option>
          {KNOWLEDGE_SKILLS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by category"
          className={fieldClass}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPageNumber(1);
          }}
          value={categoryId}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          className={fieldClass}
          onChange={(e) => {
            setStatus(e.target.value);
            setPageNumber(1);
          }}
          value={status}
        >
          <option value="">All statuses</option>
          {KNOWLEDGE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort articles"
          className={fieldClass}
          onChange={(e) => {
            setSort(e.target.value);
            setPageNumber(1);
          }}
          value={sort}
        >
          <option value="updatedAt:desc">Recently updated</option>
          <option value="publishedAt:desc">Recently published</option>
          <option value="createdAt:desc">Recently created</option>
          <option value="title:asc">Title A → Z</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-(--admin-border) bg-(--admin-surface) shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-(--admin-muted)">
            Loading articles...
          </p>
        ) : !data || data.items.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-(--admin-muted)">
              No articles match the current filters.
            </p>
            <Link
              className="admin-primary-action mt-3 inline-flex rounded-lg px-4 py-2 text-sm font-bold"
              href="/admin/knowledge/new"
            >
              + Write your first article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-(--admin-border) bg-(--admin-surface-muted) text-xs font-bold uppercase text-(--admin-muted)">
                <tr>
                  <th className="px-4 py-3">Article</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
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
                            No image
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
                            /{article.slug} - {article.estimatedReadMinutes} min
                            read
                          </p>
                        </div>
                      </div>
                    </td>
                    <td aria-label="Classification" className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit rounded-md bg-(--admin-nav-active) px-2 py-0.5 text-xs font-semibold text-(--admin-brand-red)">
                          {article.skill}
                        </span>
                        <span className="text-xs text-(--admin-ink-soft)">
                          {article.categoryName}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <KnowledgeStatusBadge status={article.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-(--admin-muted)">
                      {formatDateTimeVi(article.updatedAtUtc)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-grid grid-cols-2 gap-1.5">
                        <Link
                          aria-label="Edit article"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--admin-border) bg-white text-(--admin-ink-soft) transition duration-150 hover:border-(--admin-brand-orange) hover:bg-(--admin-row-hover) hover:text-(--admin-brand-red) hover:shadow-xs active:scale-95"
                          href={`/admin/knowledge/${article.id}`}
                          title="Edit article"
                        >
                          <ActionIcon d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
                        </Link>
                        {article.status !== "Published" ? (
                          <button
                            aria-label="Publish article"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--admin-success)/25 bg-(--admin-success-soft) text-(--admin-success) transition duration-150 hover:bg-(--admin-success) hover:text-white hover:shadow-xs active:scale-95"
                            onClick={() =>
                              void handleAction(article, "publish")
                            }
                            title="Publish article"
                            type="button"
                          >
                            <ActionIcon d="M5 13l4 4L19 7" />
                          </button>
                        ) : (
                          <button
                            aria-label="Unpublish article to draft"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--admin-warning)/25 bg-(--admin-warning-soft) text-(--admin-warning) transition duration-150 hover:bg-(--admin-warning) hover:text-white hover:shadow-xs active:scale-95"
                            onClick={() =>
                              void handleAction(article, "unpublish")
                            }
                            title="Unpublish to draft"
                            type="button"
                          >
                            <ActionIcon d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />
                          </button>
                        )}
                        {article.status !== "Archived" ? (
                          <button
                            aria-label="Archive article"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--admin-border) bg-white text-(--admin-ink-soft) transition duration-150 hover:border-(--admin-ink-soft)/40 hover:bg-(--admin-surface-muted) hover:text-(--admin-ink) hover:shadow-xs active:scale-95"
                            onClick={() =>
                              void handleAction(article, "archive")
                            }
                            title="Move to archive"
                            type="button"
                          >
                            <ActionIcon d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm1-4h16l1 4H3l1-4Zm6 9h4" />
                          </button>
                        ) : null}
                        <button
                          aria-label="Delete article"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--admin-border) bg-white text-(--admin-danger) transition duration-150 hover:border-(--admin-danger) hover:bg-(--admin-danger) hover:text-white hover:shadow-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--admin-border) disabled:hover:bg-white disabled:hover:text-(--admin-danger) disabled:hover:shadow-none"
                          disabled={article.status === "Published"}
                          onClick={() => void handleAction(article, "delete")}
                          title={
                            article.status === "Published"
                              ? "Unpublish the article before deleting"
                              : "Delete article"
                          }
                          type="button"
                        >
                          <ActionIcon d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v6M14 11v6" />
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
            itemLabel="articles"
            onPageChange={setPageNumber}
            pageNumber={data.pageNumber}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
          />
        ) : null}
      </div>

      <KnowledgeConfirmDialog
        confirmLabel="Delete article"
        description={`Are you sure you want to permanently delete "${confirmDeleteArticle?.title ?? ""}"? This action cannot be undone.`}
        onCancel={() => setConfirmDeleteArticle(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(confirmDeleteArticle)}
        pending={deleting}
        title="Confirm article deletion"
      />
    </section>
  );
}
