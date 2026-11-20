"use client";

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
  unpublishKnowledgeArticle,
  updateKnowledgeArticle,
} from "../admin-api";
import { KnowledgeApiError } from "../http";
import {
  EMPTY_TIPTAP_DOC,
  estimateReadMinutes,
  extractTocFromDoc,
} from "../tiptap-utils";
import type {
  KnowledgeArticleDetail,
  KnowledgeArticleStatus,
  KnowledgeCategory,
  KnowledgeMediaAsset,
  KnowledgeSkill,
  KnowledgeTag,
  TiptapDoc,
} from "../types";
import { KnowledgeArticlePreview } from "./knowledge-article-preview";
import { KnowledgeEditorSidebar } from "./knowledge-editor-sidebar";
import { KnowledgeEditorTopbar } from "./knowledge-editor-topbar";
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
        applyDetail(await publishKnowledgeArticle(article.id, article.version));
        toast.success("Đã xuất bản bài viết công khai!");
      } else if (action === "unpublish") {
        applyDetail(
          await unpublishKnowledgeArticle(article.id, article.version),
        );
        toast.success("Đã gỡ bài viết về bản nháp.");
      } else if (action === "archive") {
        applyDetail(await archiveKnowledgeArticle(article.id, article.version));
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
      <KnowledgeEditorTopbar
        article={article}
        currentStatus={currentStatus}
        liveReadMinutes={liveReadMinutes}
        mode={mode}
        onModeChange={setMode}
        onSave={() => void handleSave()}
        onStatusAction={(action) => void handleStatusAction(action)}
        saving={saving}
        tocCount={liveToc.length}
      />

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

          <KnowledgeEditorSidebar
            categories={categories}
            categoryId={categoryId}
            coverImageAlt={coverImageAlt}
            coverImageAssetId={coverImageAssetId}
            liveToc={liveToc}
            onCategoryChange={setCategoryId}
            onCoverAltChange={setCoverImageAlt}
            onOpenCoverPicker={() => setCoverPickerOpen(true)}
            onRemoveCover={() => {
              setCoverImageAssetId(null);
              setCoverImageAlt("");
            }}
            onSkillChange={setSkill}
            onSlugChange={setSlug}
            onTagsChange={setTags}
            skill={skill}
            slug={slug}
            tags={tags}
            tagSuggestions={tagSuggestions}
            title={title}
          />
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
