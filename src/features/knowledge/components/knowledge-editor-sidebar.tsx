"use client";

import { useState } from "react";
import { adminInput } from "@/features/admin/components/content/admin-styles";
import { toast } from "@/shared/ui/toast";
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
      <div className="space-y-3.5 rounded-2xl border border-(--admin-border) bg-(--admin-surface) p-5 shadow-sm">
        <h2 className="text-sm font-bold text-(--admin-ink)">
          Phân loại & Thiết lập
        </h2>

        <div>
          <label
            className="block text-xs font-semibold text-(--admin-ink-soft)"
            htmlFor="article-skill"
          >
            Kỹ năng *
          </label>
          <select
            className={`${adminInput} h-10 text-sm`}
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
            className="block text-xs font-semibold text-(--admin-ink-soft)"
            htmlFor="article-category"
          >
            Danh mục *
          </label>
          {categories.length === 0 ? (
            <p className="mt-1.5 rounded-lg bg-(--admin-warning-soft) p-2.5 text-xs text-(--admin-warning)">
              Chưa có danh mục nào. Hãy quay lại tab Danh mục để tạo trước.
            </p>
          ) : (
            <select
              className={`${adminInput} h-10 text-sm`}
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
            className="block text-xs font-semibold text-(--admin-ink-soft)"
            htmlFor="article-slug"
          >
            Slug URL (để trống để tự sinh)
          </label>
          <input
            className={`${adminInput} h-10 text-xs`}
            id="article-slug"
            maxLength={220}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="chien-luoc-lam-bai-reading"
            value={slug}
          />
        </div>

        <div>
          <label
            className="mb-1 block text-xs font-semibold text-(--admin-ink-soft)"
            htmlFor="article-tags"
          >
            Thẻ (Tags, tối đa 10)
          </label>
          <div className="flex gap-1.5">
            <input
              className="flex-1 rounded-lg border border-(--admin-border) bg-white px-3 py-1.5 text-xs outline-none transition focus:border-(--admin-brand-orange) focus:ring-4 focus:ring-orange-100"
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
              className="rounded-lg border border-(--admin-border) bg-white px-2.5 py-1.5 text-xs font-semibold text-(--admin-ink) hover:bg-(--admin-surface-muted)"
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
                  className="inline-flex items-center gap-1 rounded-full bg-(--admin-nav-active) px-2.5 py-0.5 text-xs font-medium text-(--admin-brand-red)"
                  key={tag}
                >
                  #{tag}
                  <button
                    aria-label={`Gỡ thẻ ${tag}`}
                    className="ml-0.5 text-[11px] hover:text-(--admin-danger)"
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

      <div className="space-y-3 rounded-2xl border border-(--admin-border) bg-(--admin-surface) p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-(--admin-ink)">
            Ảnh bìa bài viết
          </h2>
          <button
            className="text-xs font-semibold text-(--admin-brand-red) hover:underline"
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
              className="aspect-video w-full rounded-lg border border-(--admin-border) object-cover"
              src={toAdminBffMediaUrl(coverImageAssetId)}
            />
            <input
              className="w-full rounded-lg border border-(--admin-border) bg-white px-3 py-1.5 text-xs outline-none transition focus:border-(--admin-brand-orange) focus:ring-4 focus:ring-orange-100"
              maxLength={300}
              onChange={(e) => onCoverAltChange(e.target.value)}
              placeholder="Mô tả ảnh bìa (alt text)..."
              value={coverImageAlt}
            />
            <button
              className="text-xs text-(--admin-danger) hover:underline"
              onClick={onRemoveCover}
              type="button"
            >
              Gỡ ảnh bìa
            </button>
          </div>
        ) : (
          <button
            className="w-full rounded-xl border border-dashed border-(--admin-border) py-6 text-xs text-(--admin-muted) transition hover:border-(--admin-brand-red) hover:text-(--admin-brand-red)"
            onClick={onOpenCoverPicker}
            type="button"
          >
            Nhấn để tải lên hoặc chọn ảnh bìa từ thư viện
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-(--admin-border) bg-(--admin-surface) p-5 shadow-sm">
        <h2 className="text-sm font-bold text-(--admin-ink)">
          Mục lục tự động ({liveToc.length})
        </h2>
        {liveToc.length === 0 ? (
          <p className="mt-2 text-xs text-(--admin-muted)">
            Dùng nút H2, H3, H4 trên thanh công cụ để tạo cấu trúc mục lục cho
            bài viết.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-1 text-xs text-(--admin-ink-soft)">
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
