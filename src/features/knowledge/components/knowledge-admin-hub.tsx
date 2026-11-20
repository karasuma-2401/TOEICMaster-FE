"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  archiveKnowledgeArticle,
  createKnowledgeCategory,
  deleteKnowledgeArticle,
  deleteKnowledgeCategory,
  deleteKnowledgeMedia,
  listKnowledgeArticles,
  listKnowledgeCategories,
  listKnowledgeMedia,
  publishKnowledgeArticle,
  toAdminBffMediaUrl,
  unpublishKnowledgeArticle,
  updateKnowledgeCategory,
  uploadKnowledgeImage,
} from "../admin-api";
import { KnowledgeApiError } from "../http";
import { formatBytes, formatDateTimeVi } from "../tiptap-utils";
import {
  KNOWLEDGE_SKILLS,
  KNOWLEDGE_STATUSES,
  type KnowledgeArticleStatus,
  type KnowledgeArticleSummary,
  type KnowledgeCategory,
  type KnowledgeMediaAsset,
  type PageResult,
} from "../types";

type Tab = "articles" | "categories" | "media";

function StatusBadge({ status }: { status: KnowledgeArticleStatus }) {
  const styles: Record<KnowledgeArticleStatus, string> = {
    Draft:
      "bg-(--sp-warning-bg) text-(--sp-warning) border-(--sp-warning-line)",
    Published:
      "bg-(--sp-success-bg) text-(--sp-success) border-(--sp-success-border-soft)",
    Archived:
      "bg-(--sp-neutral-bg) text-(--sp-ink-2) border-(--sp-line)",
  };
  const labels: Record<KnowledgeArticleStatus, string> = {
    Draft: "Bản nháp",
    Published: "Đã xuất bản",
    Archived: "Lưu trữ",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function KnowledgeAdminHub() {
  const [tab, setTab] = useState<Tab>("articles");

  // Articles state
  const [articleQuery, setArticleQuery] = useState("");
  const [articleSkill, setArticleSkill] = useState("");
  const [articleCategoryId, setArticleCategoryId] = useState("");
  const [articleStatus, setArticleStatus] = useState("");
  const [articleSort, setArticleSort] = useState("updatedAt:desc");
  const [articlePage, setArticlePage] = useState(1);
  const [articlesData, setArticlesData] =
    useState<PageResult<KnowledgeArticleSummary> | null>(null);
  const [articlesLoading, setArticlesLoading] = useState(false);

  // Categories dropdown options (for article filter) + Categories tab state
  const [allCategories, setAllCategories] = useState<KnowledgeCategory[]>([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryHasArticles, setCategoryHasArticles] = useState("all");
  const [categorySort, setCategorySort] = useState("displayOrder:asc");
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoriesData, setCategoriesData] =
    useState<PageResult<KnowledgeCategory> | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<KnowledgeCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catOrder, setCatOrder] = useState("0");
  const [catSaving, setCatSaving] = useState(false);

  // Media tab state
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaUnused, setMediaUnused] = useState("all");
  const [mediaSort, setMediaSort] = useState("createdAt:desc");
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaData, setMediaData] =
    useState<PageResult<KnowledgeMediaAsset> | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [articlesTick, setArticlesTick] = useState(0);
  const [categoriesTick, setCategoriesTick] = useState(0);
  const [mediaTick, setMediaTick] = useState(0);
  const mediaUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function run() {
      try {
        const page = await listKnowledgeCategories(
          { pageNumber: 1, pageSize: 100 },
          controller.signal,
        );
        if (active) setAllCategories(page.items);
      } catch {
        // Non-blocking for filter dropdown
      }
    }
    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [categoriesTick]);

  useEffect(() => {
    if (tab !== "articles") return;
    const controller = new AbortController();
    let active = true;
    async function run() {
      try {
        const page = await listKnowledgeArticles(
          {
            query: articleQuery.trim() || undefined,
            skill: articleSkill || undefined,
            categoryId: articleCategoryId || undefined,
            status: articleStatus || undefined,
            sort: articleSort,
            pageNumber: articlePage,
            pageSize: 12,
          },
          controller.signal,
        );
        if (active) setArticlesData(page);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        toast.error(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách bài viết.",
        );
      } finally {
        if (active) setArticlesLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    tab,
    articleCategoryId,
    articlePage,
    articleQuery,
    articleSkill,
    articleSort,
    articleStatus,
    articlesTick,
  ]);

  useEffect(() => {
    if (tab !== "categories") return;
    const controller = new AbortController();
    let active = true;
    async function run() {
      try {
        const page = await listKnowledgeCategories(
          {
            query: categoryQuery.trim() || undefined,
            hasArticles:
              categoryHasArticles === "yes"
                ? true
                : categoryHasArticles === "no"
                  ? false
                  : undefined,
            sort: categorySort,
            pageNumber: categoryPage,
            pageSize: 15,
          },
          controller.signal,
        );
        if (active) setCategoriesData(page);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        toast.error(
          err instanceof Error ? err.message : "Không thể tải danh mục.",
        );
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    tab,
    categoryHasArticles,
    categoryPage,
    categoryQuery,
    categorySort,
    categoriesTick,
  ]);

  useEffect(() => {
    if (tab !== "media") return;
    const controller = new AbortController();
    let active = true;
    async function run() {
      try {
        const page = await listKnowledgeMedia(
          {
            query: mediaQuery.trim() || undefined,
            unusedOnly:
              mediaUnused === "unused"
                ? true
                : mediaUnused === "used"
                  ? false
                  : undefined,
            sort: mediaSort,
            pageNumber: mediaPage,
            pageSize: 16,
          },
          controller.signal,
        );
        if (active) setMediaData(page);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        toast.error(
          err instanceof Error ? err.message : "Không thể tải thư viện ảnh.",
        );
      } finally {
        if (active) setMediaLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [tab, mediaPage, mediaQuery, mediaSort, mediaUnused, mediaTick]);

  function openCreateCategory() {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatDescription("");
    setCatOrder("0");
    setCategoryModalOpen(true);
  }

  function openEditCategory(cat: KnowledgeCategory) {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description ?? "");
    setCatOrder(String(cat.displayOrder));
    setCategoryModalOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Vui lòng nhập tên danh mục.");
      return;
    }
    setCatSaving(true);
    try {
      const input = {
        name: catName.trim(),
        slug: catSlug.trim() || null,
        description: catDescription.trim() || null,
        displayOrder: Math.max(0, Number.parseInt(catOrder, 10) || 0),
      };
      if (editingCategory) {
        await updateKnowledgeCategory(
          editingCategory.id,
          editingCategory.version,
          input,
        );
        toast.success("Đã cập nhật danh mục.");
      } else {
        await createKnowledgeCategory(input);
        toast.success("Đã tạo danh mục mới.");
      }
      setCategoryModalOpen(false);
      setCategoriesTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể lưu danh mục.",
      );
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteCategory(cat: KnowledgeCategory) {
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    try {
      await deleteKnowledgeCategory(cat.id, cat.version);
      toast.success("Đã xóa danh mục.");
      setCategoriesTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể xóa danh mục.",
      );
    }
  }

  async function handleQuickArticleAction(
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
      setArticlesTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể thực hiện thao tác.",
      );
    }
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMediaUploading(true);
    try {
      await uploadKnowledgeImage(file);
      toast.success("Đã tải lên hình ảnh mới.");
      setMediaTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tải lên hình ảnh.",
      );
    } finally {
      setMediaUploading(false);
    }
  }

  async function handleDeleteMedia(asset: KnowledgeMediaAsset) {
    if (!window.confirm(`Xóa hình ảnh "${asset.originalFileName}"?`)) return;
    try {
      await deleteKnowledgeMedia(asset.id);
      toast.success("Đã xóa hình ảnh.");
      setMediaTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể xóa hình ảnh.",
      );
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition ${
      active
        ? "bg-(--sp-brand) text-white shadow-sm"
        : "text-(--sp-ink-2) hover:bg-(--sp-subtle)"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-(--sp-ink)">
            Quản trị Kiến thức & Tài liệu mẫu
          </h1>
          <p className="mt-1 text-sm text-(--sp-ink-2)">
            Soạn thảo, phân loại, xem trước và xuất bản bài viết hướng dẫn TOEIC
            cho học viên.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "categories" ? (
            <button
              className="rounded-xl bg-(--sp-brand) px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              onClick={openCreateCategory}
              type="button"
            >
              + Tạo danh mục mới
            </button>
          ) : tab === "media" ? (
            <>
              <input
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleMediaUpload}
                ref={mediaUploadRef}
                type="file"
              />
              <button
                className="rounded-xl bg-(--sp-brand) px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                disabled={mediaUploading}
                onClick={() => mediaUploadRef.current?.click()}
                type="button"
              >
                {mediaUploading ? "Đang tải lên..." : "+ Tải hình ảnh mới"}
              </button>
            </>
          ) : (
            <Link
              className="rounded-xl bg-(--sp-brand) px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              href="/admin/knowledge/new"
            >
              + Tạo bài viết mới
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-(--sp-line) bg-(--sp-surface) p-1.5">
        <button
          className={tabClass(tab === "articles")}
          onClick={() => setTab("articles")}
          type="button"
        >
          Bài viết
        </button>
        <button
          className={tabClass(tab === "categories")}
          onClick={() => setTab("categories")}
          type="button"
        >
          Danh mục ({allCategories.length})
        </button>
        <button
          className={tabClass(tab === "media")}
          onClick={() => setTab("media")}
          type="button"
        >
          Thư viện ảnh
        </button>
      </div>

      {tab === "articles" ? (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-(--sp-line) bg-(--sp-surface) p-4 sm:grid-cols-2 lg:grid-cols-5">
            <input
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm outline-none focus:border-(--sp-brand)"
              onChange={(e) => {
                setArticleQuery(e.target.value);
                setArticlePage(1);
              }}
              placeholder="Tìm theo tiêu đề bài viết..."
              type="search"
              value={articleQuery}
            />
            <select
              aria-label="Lọc theo kỹ năng"
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                setArticleSkill(e.target.value);
                setArticlePage(1);
              }}
              value={articleSkill}
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
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                setArticleCategoryId(e.target.value);
                setArticlePage(1);
              }}
              value={articleCategoryId}
            >
              <option value="">Tất cả danh mục</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Lọc theo trạng thái"
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                setArticleStatus(e.target.value);
                setArticlePage(1);
              }}
              value={articleStatus}
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
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                setArticleSort(e.target.value);
                setArticlePage(1);
              }}
              value={articleSort}
            >
              <option value="updatedAt:desc">Mới cập nhật</option>
              <option value="publishedAt:desc">Mới xuất bản</option>
              <option value="createdAt:desc">Mới tạo</option>
              <option value="title:asc">Tiêu đề A → Z</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-(--sp-line) bg-(--sp-surface) shadow-sm">
            {articlesLoading ? (
              <p className="py-12 text-center text-sm text-(--sp-ink-2)">
                Đang tải danh sách bài viết...
              </p>
            ) : !articlesData || articlesData.items.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm text-(--sp-ink-2)">
                  Chưa có bài viết nào khớp với bộ lọc hiện tại.
                </p>
                <Link
                  className="mt-3 inline-block rounded-lg bg-(--sp-orange-soft) px-4 py-2 text-sm font-semibold text-(--sp-brand) hover:bg-(--sp-brand) hover:text-white"
                  href="/admin/knowledge/new"
                >
                  + Viết bài kiến thức đầu tiên
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-(--sp-line) bg-(--sp-subtle) text-xs font-bold uppercase text-(--sp-ink-2)">
                    <tr>
                      <th className="px-4 py-3">Bài viết</th>
                      <th className="px-4 py-3">Phân loại</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Cập nhật</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--sp-line)">
                    {articlesData.items.map((article) => (
                      <tr
                        className="hover:bg-(--sp-row-hover)"
                        key={article.id}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {article.coverImageAssetId ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                alt={article.coverImageAlt || article.title}
                                className="h-12 w-16 shrink-0 rounded-lg border border-(--sp-line) object-cover"
                                src={toAdminBffMediaUrl(
                                  article.coverImageAssetId,
                                )}
                              />
                            ) : (
                              <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-(--sp-line) bg-(--sp-subtle) text-[10px] text-(--sp-ink-3)">
                                Không ảnh
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link
                                className="block truncate font-semibold text-(--sp-ink) hover:text-(--sp-brand)"
                                href={`/admin/knowledge/${article.id}`}
                              >
                                {article.title}
                              </Link>
                              <p className="truncate text-xs text-(--sp-ink-3)">
                                /{article.slug} · {article.estimatedReadMinutes}{" "}
                                phút đọc
                              </p>
                            </div>
                          </div>
                        </td>
                        <td aria-label="Phân loại" className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit rounded-md bg-(--sp-orange-soft) px-2 py-0.5 text-xs font-semibold text-(--sp-brand)">
                              {article.skill}
                            </span>
                            <span className="text-xs text-(--sp-ink-2)">
                              {article.categoryName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={article.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-(--sp-ink-2)">
                          {formatDateTimeVi(article.updatedAtUtc)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            <Link
                              className="rounded-md border border-(--sp-line) bg-white px-2.5 py-1 text-xs font-semibold text-(--sp-ink) hover:bg-(--sp-subtle)"
                              href={`/admin/knowledge/${article.id}`}
                            >
                              Sửa
                            </Link>
                            {article.status !== "Published" ? (
                              <button
                                className="rounded-md bg-(--sp-success-bg) px-2.5 py-1 text-xs font-semibold text-(--sp-success) hover:opacity-85"
                                onClick={() =>
                                  void handleQuickArticleAction(
                                    article,
                                    "publish",
                                  )
                                }
                                type="button"
                              >
                                Xuất bản
                              </button>
                            ) : (
                              <button
                                className="rounded-md bg-(--sp-warning-bg) px-2.5 py-1 text-xs font-semibold text-(--sp-warning) hover:opacity-85"
                                onClick={() =>
                                  void handleQuickArticleAction(
                                    article,
                                    "unpublish",
                                  )
                                }
                                type="button"
                              >
                                Gỡ
                              </button>
                            )}
                            {article.status !== "Archived" ? (
                              <button
                                className="rounded-md border border-(--sp-line) px-2.5 py-1 text-xs text-(--sp-ink-2) hover:bg-(--sp-subtle)"
                                onClick={() =>
                                  void handleQuickArticleAction(
                                    article,
                                    "archive",
                                  )
                                }
                                type="button"
                              >
                                Lưu trữ
                              </button>
                            ) : null}
                            <button
                              className="rounded-md border border-(--sp-line) px-2.5 py-1 text-xs text-(--sp-danger) hover:bg-(--sp-danger-bg) disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={article.status === "Published"}
                              onClick={() =>
                                void handleQuickArticleAction(article, "delete")
                              }
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

            {articlesData && articlesData.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-(--sp-line) px-4 py-3 text-xs text-(--sp-ink-2)">
                <span>
                  Trang {articlesData.pageNumber} / {articlesData.totalPages} (
                  {articlesData.totalCount} bài viết)
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-(--sp-line) px-3 py-1 disabled:opacity-40"
                    disabled={!articlesData.hasPreviousPage}
                    onClick={() => setArticlePage((p) => p - 1)}
                    type="button"
                  >
                    Trước
                  </button>
                  <button
                    className="rounded-md border border-(--sp-line) px-3 py-1 disabled:opacity-40"
                    disabled={!articlesData.hasNextPage}
                    onClick={() => setArticlePage((p) => p + 1)}
                    type="button"
                  >
                    Sau
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === "categories" ? (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-(--sp-line) bg-(--sp-surface) p-4 sm:grid-cols-3">
            <input
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm outline-none focus:border-(--sp-brand)"
              onChange={(e) => {
                setCategoryQuery(e.target.value);
                setCategoryPage(1);
              }}
              placeholder="Tìm theo tên hoặc slug danh mục..."
              type="search"
              value={categoryQuery}
            />
            <select
              aria-label="Lọc danh mục theo bài viết"
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                setCategoryHasArticles(e.target.value);
                setCategoryPage(1);
              }}
              value={categoryHasArticles}
            >
              <option value="all">Tất cả danh mục</option>
              <option value="yes">Đang có bài viết</option>
              <option value="no">Danh mục trống</option>
            </select>
            <select
              aria-label="Sắp xếp danh mục"
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                setCategorySort(e.target.value);
                setCategoryPage(1);
              }}
              value={categorySort}
            >
              <option value="displayOrder:asc">Thứ tự hiển thị (tăng)</option>
              <option value="name:asc">Tên A → Z</option>
              <option value="updatedAt:desc">Mới cập nhật</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-(--sp-line) bg-(--sp-surface) shadow-sm">
            {categoriesLoading ? (
              <p className="py-12 text-center text-sm text-(--sp-ink-2)">
                Đang tải danh mục...
              </p>
            ) : !categoriesData || categoriesData.items.length === 0 ? (
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
                    {categoriesData.items.map((cat) => (
                      <tr
                        className="hover:bg-(--sp-row-hover)"
                        key={cat.id}
                      >
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
                        <td
                          aria-label="Thao tác"
                          className="px-4 py-3 text-right"
                        >
                          <div className="inline-flex gap-1.5">
                            <button
                              className="rounded-md border border-(--sp-line) bg-white px-2.5 py-1 text-xs font-semibold text-(--sp-ink) hover:bg-(--sp-subtle)"
                              onClick={() => openEditCategory(cat)}
                              type="button"
                            >
                              Sửa
                            </button>
                            <button
                              className="rounded-md border border-(--sp-line) px-2.5 py-1 text-xs text-(--sp-danger) hover:bg-(--sp-danger-bg) disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={cat.articleCount > 0}
                              onClick={() => void handleDeleteCategory(cat)}
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

            {categoriesData && categoriesData.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-(--sp-line) px-4 py-3 text-xs text-(--sp-ink-2)">
                <span>
                  Trang {categoriesData.pageNumber} /{" "}
                  {categoriesData.totalPages} ({categoriesData.totalCount} danh
                  mục)
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-(--sp-line) px-3 py-1 disabled:opacity-40"
                    disabled={!categoriesData.hasPreviousPage}
                    onClick={() => setCategoryPage((p) => p - 1)}
                    type="button"
                  >
                    Trước
                  </button>
                  <button
                    className="rounded-md border border-(--sp-line) px-3 py-1 disabled:opacity-40"
                    disabled={!categoriesData.hasNextPage}
                    onClick={() => setCategoryPage((p) => p + 1)}
                    type="button"
                  >
                    Sau
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === "media" ? (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-(--sp-line) bg-(--sp-surface) p-4 sm:grid-cols-3">
            <input
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm outline-none focus:border-(--sp-brand)"
              onChange={(e) => {
                setMediaQuery(e.target.value);
                setMediaPage(1);
              }}
              placeholder="Tìm theo tên file ảnh..."
              type="search"
              value={mediaQuery}
            />
            <select
              aria-label="Lọc ảnh theo trạng thái sử dụng"
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                setMediaUnused(e.target.value);
                setMediaPage(1);
              }}
              value={mediaUnused}
            >
              <option value="all">Tất cả hình ảnh</option>
              <option value="used">Đang được dùng trong bài</option>
              <option value="unused">Chưa được dùng (có thể xóa)</option>
            </select>
            <select
              aria-label="Sắp xếp hình ảnh"
              className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                setMediaSort(e.target.value);
                setMediaPage(1);
              }}
              value={mediaSort}
            >
              <option value="createdAt:desc">Mới tải lên</option>
              <option value="fileName:asc">Tên file A → Z</option>
              <option value="byteLength:desc">Dung lượng lớn nhất</option>
            </select>
          </div>

          <div className="rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-5 shadow-sm">
            {mediaLoading ? (
              <p className="py-12 text-center text-sm text-(--sp-ink-2)">
                Đang tải thư viện ảnh...
              </p>
            ) : !mediaData || mediaData.items.length === 0 ? (
              <p className="py-12 text-center text-sm text-(--sp-ink-2)">
                Chưa có hình ảnh nào.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {mediaData.items.map((asset) => {
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
                          onClick={() => void handleDeleteMedia(asset)}
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

            {mediaData && mediaData.totalPages > 1 ? (
              <div className="mt-5 flex items-center justify-between border-t border-(--sp-line) pt-3 text-xs text-(--sp-ink-2)">
                <span>
                  Trang {mediaData.pageNumber} / {mediaData.totalPages} (
                  {mediaData.totalCount} ảnh)
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-(--sp-line) px-3 py-1 disabled:opacity-40"
                    disabled={!mediaData.hasPreviousPage}
                    onClick={() => setMediaPage((p) => p - 1)}
                    type="button"
                  >
                    Trước
                  </button>
                  <button
                    className="rounded-md border border-(--sp-line) px-3 py-1 disabled:opacity-40"
                    disabled={!mediaData.hasNextPage}
                    onClick={() => setMediaPage((p) => p + 1)}
                    type="button"
                  >
                    Sau
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {categoryModalOpen ? (
        <dialog
          aria-label={
            editingCategory ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"
          }
          aria-modal="true"
          className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/50 p-4"
          open
        >
          <form
            className="w-full max-w-md space-y-4 rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-6 shadow-2xl"
            onSubmit={handleSaveCategory}
          >
            <h2 className="text-lg font-bold text-(--sp-ink)">
              {editingCategory ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
            </h2>
            <div>
              <label
                className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                htmlFor="cat-name"
              >
                Tên danh mục *
              </label>
              <input
                className="w-full rounded-lg border border-(--sp-input-line) px-3 py-2 text-sm outline-none focus:border-(--sp-brand)"
                id="cat-name"
                maxLength={100}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="VD: Mẹo làm bài Reading"
                required
                value={catName}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                htmlFor="cat-slug"
              >
                Slug (để trống để tự sinh từ tên)
              </label>
              <input
                className="w-full rounded-lg border border-(--sp-input-line) px-3 py-2 text-sm outline-none focus:border-(--sp-brand)"
                id="cat-slug"
                maxLength={120}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="meo-lam-bai-reading"
                value={catSlug}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                htmlFor="cat-desc"
              >
                Mô tả ngắn
              </label>
              <textarea
                className="w-full rounded-lg border border-(--sp-input-line) px-3 py-2 text-sm outline-none focus:border-(--sp-brand)"
                id="cat-desc"
                maxLength={500}
                onChange={(e) => setCatDescription(e.target.value)}
                rows={3}
                value={catDescription}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                htmlFor="cat-order"
              >
                Thứ tự hiển thị
              </label>
              <input
                className="w-28 rounded-lg border border-(--sp-input-line) px-3 py-2 text-sm outline-none focus:border-(--sp-brand)"
                id="cat-order"
                min={0}
                onChange={(e) => setCatOrder(e.target.value)}
                type="number"
                value={catOrder}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="rounded-lg border border-(--sp-line) px-4 py-2 text-sm text-(--sp-ink-2)"
                onClick={() => setCategoryModalOpen(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="rounded-lg bg-(--sp-brand) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={catSaving}
                type="submit"
              >
                {catSaving ? "Đang lưu..." : "Lưu danh mục"}
              </button>
            </div>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
