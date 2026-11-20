"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createKnowledgeCategory, updateKnowledgeCategory } from "../admin-api";
import { KnowledgeApiError } from "../http";
import type { KnowledgeCategory } from "../types";

interface KnowledgeCategoryModalProps {
  editingCategory: KnowledgeCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

export function KnowledgeCategoryModal({
  editingCategory,
  onClose,
  onSaved,
}: KnowledgeCategoryModalProps) {
  const [name, setName] = useState(editingCategory?.name ?? "");
  const [slug, setSlug] = useState(editingCategory?.slug ?? "");
  const [description, setDescription] = useState(
    editingCategory?.description ?? "",
  );
  const [displayOrder, setDisplayOrder] = useState(
    String(editingCategory?.displayOrder ?? 0),
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên danh mục.");
      return;
    }

    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        slug: slug.trim() || null,
        description: description.trim() || null,
        displayOrder: Math.max(0, Number.parseInt(displayOrder, 10) || 0),
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
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể lưu danh mục.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      aria-label={editingCategory ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
      aria-modal="true"
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/50 p-4"
      open
    >
      <form
        className="w-full max-w-md space-y-4 rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-6 shadow-2xl"
        onSubmit={handleSubmit}
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
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Mẹo làm bài Reading"
            required
            value={name}
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
            onChange={(e) => setSlug(e.target.value)}
            placeholder="meo-lam-bai-reading"
            value={slug}
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
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            value={description}
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
            onChange={(e) => setDisplayOrder(e.target.value)}
            type="number"
            value={displayOrder}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="rounded-lg border border-(--sp-line) px-4 py-2 text-sm text-(--sp-ink-2)"
            onClick={onClose}
            type="button"
          >
            Hủy
          </button>
          <button
            className="rounded-lg bg-(--sp-brand) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            {saving ? "Đang lưu..." : "Lưu danh mục"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
