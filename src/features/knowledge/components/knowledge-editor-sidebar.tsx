"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { toAdminBffMediaUrl } from "../admin-api";
import {
  KNOWLEDGE_SKILLS,
  type KnowledgeCategory,
  type KnowledgeSkill,
  type KnowledgeTag,
  type KnowledgeTocItem,
} from "../types";

interface KnowledgeEditorSidebarProps {
  title: string;
  skill: KnowledgeSkill;
  categoryId: string;
  slug: string;
  tags: string[];
  coverImageAssetId: string | null;
  coverImageAlt: string;
  categories: KnowledgeCategory[];
  tagSuggestions: KnowledgeTag[];
  liveToc: KnowledgeTocItem[];
  onSkillChange: (skill: KnowledgeSkill) => void;
  onCategoryChange: (categoryId: string) => void;
  onSlugChange: (slug: string) => void;
  onTagsChange: (tags: string[]) => void;
  onCoverAltChange: (alt: string) => void;
  onRemoveCover: () => void;
  onOpenCoverPicker: () => void;
}

export function KnowledgeEditorSidebar({
  title,
  skill,
  categoryId,
  slug,
  tags,
  coverImageAssetId,
  coverImageAlt,
  categories,
  tagSuggestions,
  liveToc,
  onSkillChange,
  onCategoryChange,
  onSlugChange,
  onTagsChange,
  onCoverAltChange,
  onRemoveCover,
  onOpenCoverPicker,
}: KnowledgeEditorSidebarProps) {
  const [tagInput, setTagInput] = useState("");

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
    onTagsChange([...tags, cleaned]);
    setTagInput("");
  }

  return (
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
            onChange={(e) => onSkillChange(e.target.value as KnowledgeSkill)}
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
              Chưa có danh mục nào. Hãy quay lại tab Danh mục để tạo trước.
            </p>
          ) : (
            <select
              className="w-full rounded-lg border border-(--sp-input-line) bg-white px-3 py-2 text-sm"
              id="article-category"
              onChange={(e) => onCategoryChange(e.target.value)}
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
            onChange={(e) => onSlugChange(e.target.value)}
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
                    onClick={() =>
                      onTagsChange(tags.filter((item) => item !== tag))
                    }
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
            onClick={onOpenCoverPicker}
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
              onChange={(e) => onCoverAltChange(e.target.value)}
              placeholder="Mô tả ảnh bìa (alt text)..."
              value={coverImageAlt}
            />
            <button
              className="text-xs text-(--sp-danger) hover:underline"
              onClick={onRemoveCover}
              type="button"
            >
              Gỡ ảnh bìa
            </button>
          </div>
        ) : (
          <button
            className="w-full rounded-xl border border-dashed border-(--sp-line) py-6 text-xs text-(--sp-ink-2) hover:border-(--sp-brand) hover:text-(--sp-brand)"
            onClick={onOpenCoverPicker}
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
            Dùng nút H2, H3, H4 trên thanh công cụ để tạo cấu trúc mục lục cho
            bài viết.
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
  );
}
