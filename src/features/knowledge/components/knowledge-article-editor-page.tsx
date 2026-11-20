"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  archiveKnowledgeArticle,
  createKnowledgeArticle,
  deleteKnowledgeArticle,
  getKnowledgeArticle,
  listKnowledgeCategories,
  listKnowledgeTags,
  publishKnowledgeArticle,
  toAdminBffMediaUrl,
  unpublishKnowledgeArticle,
  updateKnowledgeArticle,
} from "../admin-api";
import { KnowledgeApiError } from "../http";
import {
  EMPTY_TIPTAP_DOC,
  estimateReadMinutes,
  extractTocFromDoc,
} from "../tiptap-utils";
import {
  KNOWLEDGE_SKILLS,
  type KnowledgeArticleDetail,
  type KnowledgeArticleStatus,
  type KnowledgeCategory,
  type KnowledgeMediaAsset,
  type KnowledgeSkill,
  type KnowledgeTag,
  type TiptapDoc,
} from "../types";
import { KnowledgeArticlePreview } from "./knowledge-article-preview";
import { KnowledgeMediaPickerModal } from "./knowledge-media-picker-modal";
import { KnowledgeTiptapEditor } from "./knowledge-tiptap-editor";

interface KnowledgeArticleEditorPageProps {
  articleId?: string;
}

export function KnowledgeArticleEditorPage({
  articleId,
}: KnowledgeArticleEditorPageProps) {
  const router = useRouter();
  const isEditing = Boolean(articleId);

  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [article, setArticle] = useState<KnowledgeArticleDetail | null>(null);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<KnowledgeTag[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [skill, setSkill] = useState<KnowledgeSkill>("General");
  const [categoryId, setCategoryId] = useState("");
  const [coverImageAssetId, setCoverImageAssetId] = useState<string | null>(
    null,
  );
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState<TiptapDoc>(EMPTY_TIPTAP_DOC);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  const applyDetail = useCallback((detail: KnowledgeArticleDetail) => {
    setArticle(detail);
    setTitle(detail.title);
    setSlug(detail.slug);
    setSummary(detail.summary);
    setSkill(detail.skill);
    setCategoryId(detail.categoryId);
    setCoverImageAssetId(detail.coverImageAssetId);
    setCoverImageAlt(detail.coverImageAlt ?? "");
    setTags(detail.tags.map((t) => t.name));
    setContent(detail.content ?? EMPTY_TIPTAP_DOC);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [catPage, tagPage] = await Promise.all([
          listKnowledgeCategories({ pageNumber: 1, pageSize: 100 }),
          listKnowledgeTags({ pageNumber: 1, pageSize: 50 }),
        ]);
        if (!active) return;
        setCategories(catPage.items);
        setTagSuggestions(tagPage.items);

        if (articleId) {
          const detail = await getKnowledgeArticle(articleId);
          if (!active) return;
          applyDetail(detail);
        } else if (catPage.items.length > 0) {
          setCategoryId(catPage.items[0].id);
        }
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Không thể tải dữ liệu bài viết.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [articleId, applyDetail]);

  const selectedCategoryName =
    categories.find((c) => c.id === categoryId)?.name ?? "";
  const liveToc = extractTocFromDoc(content);
  const liveReadMinutes = estimateReadMinutes(content);
  const currentStatus: KnowledgeArticleStatus = article?.status ?? "Draft";

  function addTag(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (tags.length >= 10) {
      toast.error("Mỗi bài viết chỉ gắn tối đa 10 thẻ.");
      return;
    }
    if (tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, cleaned]);
    setTagInput("");
  }

  function removeTag(name: string) {
    setTags((prev) => prev.filter((t) => t !== name));
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    if (!summary.trim()) {
      toast.error("Vui lòng nhập mô tả ngắn (tóm tắt) cho bài viết.");
      return;
    }
    if (!categoryId) {
      toast.error("Vui lòng chọn danh mục bài viết (hoặc tạo danh mục trước).");
      return;
    }

    setSaving(true);
    try {
      const input = {
        title: title.trim(),
        slug: slug.trim() || null,
        summary: summary.trim(),
        skill,
        categoryId,
        coverImageAssetId,
        coverImageAlt: coverImageAlt.trim() || null,
        content,
        tags,
      };

      if (article) {
        const updated = await updateKnowledgeArticle(
          article.id,
          article.version,
          input,
        );
        applyDetail(updated);
        toast.success("Đã lưu thay đổi bài viết.");
      } else {
        const created = await createKnowledgeArticle(input);
        toast.success("Đã tạo bài viết bản nháp.");
        router.replace(`/admin/knowledge/${created.id}`);
      }
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể lưu bài viết.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusAction(
    action: "publish" | "unpublish" | "archive" | "delete",
  ) {
    if (!article) return;
    if (
      action === "delete" &&
      !window.confirm(`Xóa vĩnh viễn bài viết "${article.title}"?`)
    ) {
      return;
    }

    setSaving(true);
    try {
      if (action === "publish") {
        const updated = await publishKnowledgeArticle(
          article.id,
          article.version,
        );
        applyDetail(updated);
        toast.success("Đã xuất bản bài viết công khai!");
      } else if (action === "unpublish") {
        const updated = await unpublishKnowledgeArticle(
          article.id,
          article.version,
        );
        applyDetail(updated);
        toast.success("Đã gỡ bài viết về bản nháp.");
      } else if (action === "archive") {
        const updated = await archiveKnowledgeArticle(
          article.id,
          article.version,
        );
        applyDetail(updated);
        toast.success("Đã chuyển bài viết vào lưu trữ.");
      } else {
        await deleteKnowledgeArticle(article.id, article.version);
        toast.success("Đã xóa bài viết.");
        router.push("/admin/knowledge");
      }
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể cập nhật trạng thái bài viết.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-12 text-center text-sm text-(--sp-ink-2)">
        Đang tải trình soạn thảo bài viết...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--sp-line) bg-(--sp-surface) px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            className="rounded-lg border border-(--sp-line) px-3 py-1.5 text-xs font-semibold text-(--sp-ink-2) hover:bg-(--sp-subtle)"
            href="/admin/knowledge"
          >
            ← Danh sách
          </Link>
          <div>
            <h1 className="text-base font-bold text-(--sp-ink)">
              {article ? "Chỉnh sửa bài viết" : "Tạo bài viết kiến thức mới"}
            </h1>
            <p className="text-xs text-(--sp-ink-3)">
              Trạng thái: <strong>{currentStatus}</strong> · {liveReadMinutes}{" "}
              phút đọc · {liveToc.length} mục lục
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-(--sp-line) bg-(--sp-subtle) p-0.5 text-xs font-semibold">
            <button
              className={`rounded-md px-3 py-1.5 transition ${
                mode === "edit"
                  ? "bg-white text-(--sp-ink) shadow-sm"
                  : "text-(--sp-ink-2)"
              }`}
              onClick={() => setMode("edit")}
              type="button"
            >
              Soạn thảo
            </button>
            <button
              className={`rounded-md px-3 py-1.5 transition ${
                mode === "preview"
                  ? "bg-white text-(--sp-brand) shadow-sm"
                  : "text-(--sp-ink-2)"
              }`}
              onClick={() => setMode("preview")}
              type="button"
            >
              Xem trước (Preview)
            </button>
          </div>

          <button
            className="rounded-lg bg-(--sp-brand) px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            disabled={saving}
            onClick={() => void handleSave()}
            type="button"
          >
            {saving ? "Đang lưu..." : article ? "Lưu thay đổi" : "Lưu bản nháp"}
          </button>

          {article ? (
            <>
              {article.status !== "Published" ? (
                <button
                  className="rounded-lg bg-(--sp-success) px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  disabled={saving}
                  onClick={() => void handleStatusAction("publish")}
                  type="button"
                >
                  Xuất bản
                </button>
              ) : (
                <button
                  className="rounded-lg bg-(--sp-warning-bg) px-3.5 py-2 text-xs font-semibold text-(--sp-warning) hover:opacity-90 disabled:opacity-50"
                  disabled={saving}
                  onClick={() => void handleStatusAction("unpublish")}
                  type="button"
                >
                  Gỡ xuất bản
                </button>
              )}
              {article.status !== "Archived" ? (
                <button
                  className="rounded-lg border border-(--sp-line) px-3 py-2 text-xs font-semibold text-(--sp-ink-2) hover:bg-(--sp-subtle)"
                  disabled={saving}
                  onClick={() => void handleStatusAction("archive")}
                  type="button"
                >
                  Lưu trữ
                </button>
              ) : null}
              <button
                className="rounded-lg border border-(--sp-line) px-3 py-2 text-xs font-semibold text-(--sp-danger) hover:bg-(--sp-danger-bg) disabled:cursor-not-allowed disabled:opacity-40"
                disabled={saving || article.status === "Published"}
                onClick={() => void handleStatusAction("delete")}
                title={
                  article.status === "Published"
                    ? "Gỡ xuất bản trước khi xóa"
                    : "Xóa bài viết"
                }
                type="button"
              >
                Xóa
              </button>
            </>
          ) : null}
        </div>
      </div>

      {mode === "preview" ? (
        <KnowledgeArticlePreview
          categoryName={selectedCategoryName}
          content={content}
          coverImageAlt={coverImageAlt || null}
          coverImageAssetId={coverImageAssetId}
          skill={skill}
          status={currentStatus}
          summary={summary}
          tags={tags}
          title={title}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-5 shadow-sm">
              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                  htmlFor="article-title"
                >
                  Tiêu đề bài viết *
                </label>
                <input
                  className="w-full rounded-lg border border-(--sp-input-line) px-3.5 py-2.5 text-base font-bold text-(--sp-ink) outline-none focus:border-(--sp-brand)"
                  id="article-title"
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Chiến lược làm bài Reading đạt 450+ điểm"
                  value={title}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                  htmlFor="article-summary"
                >
                  Tóm tắt ngắn (Summary) *
                </label>
                <textarea
                  className="w-full rounded-lg border border-(--sp-input-line) px-3.5 py-2 text-sm outline-none focus:border-(--sp-brand)"
                  id="article-summary"
                  maxLength={500}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Đoạn giới thiệu ngắn hiển thị ngoài danh sách bài viết..."
                  rows={2}
                  value={summary}
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-(--sp-ink-2)">
                  Nội dung bài viết (Rich Text Editor) *
                </span>
                <KnowledgeTiptapEditor onChange={setContent} value={content} />
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="space-y-3.5 rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-5 shadow-sm">
              <h2 className="text-sm font-bold text-(--sp-ink)">
                Phân loại & Thiết lập
              </h2>

              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                  htmlFor="article-skill"
                >
                  Kỹ năng *
                </label>
                <select
                  className="w-full rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
                  id="article-skill"
                  onChange={(e) => setSkill(e.target.value as KnowledgeSkill)}
                  value={skill}
                >
                  {KNOWLEDGE_SKILLS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                  htmlFor="article-category"
                >
                  Danh mục *
                </label>
                {categories.length === 0 ? (
                  <p className="rounded-lg bg-(--sp-warning-bg) p-2.5 text-xs text-(--sp-warning)">
                    Chưa có danh mục nào. Hãy quay lại tab Danh mục để tạo
                    trước.
                  </p>
                ) : (
                  <select
                    className="w-full rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
                    id="article-category"
                    onChange={(e) => setCategoryId(e.target.value)}
                    value={categoryId}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                  htmlFor="article-slug"
                >
                  Slug URL (để trống để tự sinh)
                </label>
                <input
                  className="w-full rounded-lg border border-(--sp-input-line) px-3 py-2 text-xs outline-none focus:border-(--sp-brand)"
                  id="article-slug"
                  maxLength={220}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="chien-luoc-lam-bai-reading"
                  value={slug}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-(--sp-ink-2)"
                  htmlFor="article-tags"
                >
                  Thẻ (Tags, tối đa 10)
                </label>
                <div className="flex gap-1.5">
                  <input
                    className="flex-1 rounded-lg border border-(--sp-input-line) px-3 py-1.5 text-xs outline-none focus:border-(--sp-brand)"
                    id="article-tags"
                    list="knowledge-tag-suggestions"
                    maxLength={50}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Nhập tag rồi nhấn Enter..."
                    value={tagInput}
                  />
                  <button
                    className="rounded-lg border border-(--sp-line) px-2.5 py-1.5 text-xs font-semibold hover:bg-(--sp-subtle)"
                    onClick={() => addTag(tagInput)}
                    type="button"
                  >
                    Thêm
                  </button>
                </div>
                <datalist id="knowledge-tag-suggestions">
                  {tagSuggestions.map((t) => (
                    <option key={t.id} label={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </datalist>
                {tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-(--sp-orange-soft) px-2.5 py-0.5 text-xs font-medium text-(--sp-brand)"
                        key={tag}
                      >
                        #{tag}
                        <button
                          aria-label={`Gỡ thẻ ${tag}`}
                          className="ml-0.5 text-[11px] hover:text-(--sp-danger)"
                          onClick={() => removeTag(tag)}
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-(--sp-ink)">
                  Ảnh bìa bài viết
                </h2>
                <button
                  className="text-xs font-semibold text-(--sp-brand) hover:underline"
                  onClick={() => setCoverPickerOpen(true)}
                  type="button"
                >
                  {coverImageAssetId ? "Đổi ảnh" : "+ Chọn ảnh"}
                </button>
              </div>
              {coverImageAssetId ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={coverImageAlt || title}
                    className="aspect-video w-full rounded-lg border border-(--sp-line) object-cover"
                    src={toAdminBffMediaUrl(coverImageAssetId)}
                  />
                  <input
                    className="w-full rounded-lg border border-(--sp-input-line) px-3 py-1.5 text-xs outline-none focus:border-(--sp-brand)"
                    maxLength={300}
                    onChange={(e) => setCoverImageAlt(e.target.value)}
                    placeholder="Mô tả ảnh bìa (alt text)..."
                    value={coverImageAlt}
                  />
                  <button
                    className="text-xs text-(--sp-danger) hover:underline"
                    onClick={() => {
                      setCoverImageAssetId(null);
                      setCoverImageAlt("");
                    }}
                    type="button"
                  >
                    Gỡ ảnh bìa
                  </button>
                </div>
              ) : (
                <button
                  className="w-full rounded-xl border border-dashed border-(--sp-line) py-6 text-xs text-(--sp-ink-2) hover:border-(--sp-brand) hover:text-(--sp-brand)"
                  onClick={() => setCoverPickerOpen(true)}
                  type="button"
                >
                  Nhấn để tải lên hoặc chọn ảnh bìa từ thư viện
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-5 shadow-sm">
              <h2 className="text-sm font-bold text-(--sp-ink)">
                Mục lục tự động ({liveToc.length})
              </h2>
              {liveToc.length === 0 ? (
                <p className="mt-2 text-xs text-(--sp-ink-3)">
                  Dùng nút H2, H3, H4 trên thanh công cụ để tạo cấu trúc mục lục
                  cho bài viết.
                </p>
              ) : (
                <ul className="mt-2.5 space-y-1 text-xs text-(--sp-ink-2)">
                  {liveToc.map((item) => (
                    <li
                      className={
                        item.level === 3
                          ? "pl-3"
                          : item.level >= 4
                            ? "pl-6"
                            : "font-semibold"
                      }
                      key={item.id}
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      <KnowledgeMediaPickerModal
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(asset: KnowledgeMediaAsset) => {
          setCoverImageAssetId(asset.id);
          if (!coverImageAlt) setCoverImageAlt(asset.originalFileName);
        }}
        open={coverPickerOpen}
        title="Chọn ảnh bìa bài viết"
      />
    </div>
  );
}
