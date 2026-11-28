"use client";

import { useState } from "react";
import {
  adminFocus,
  adminInput,
  adminSecondary,
  adminTextarea,
} from "@/features/admin/components/content/admin-styles";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { toast } from "@/shared/ui/toast";
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
      toast.error("Please enter a category name.");
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
        toast.success("Category updated.");
      } else {
        await createKnowledgeCategory(input);
        toast.success("New category created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Could not save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open
    >
      <DialogContent
        aria-describedby={undefined}
        className="rounded-2xl border-(--admin-border) bg-(--admin-surface) p-6"
        showCloseButton={false}
        size="sm"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogTitle className="text-lg font-bold text-(--admin-ink)">
            {editingCategory ? "Edit category" : "New category"}
          </DialogTitle>
          <div>
            <label
              className="block text-xs font-semibold text-(--admin-ink-soft)"
              htmlFor="cat-name"
            >
              Category name *
            </label>
            <input
              className={adminInput}
              id="cat-name"
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reading Strategies"
              required
              value={name}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-(--admin-ink-soft)"
              htmlFor="cat-slug"
            >
              Slug (leave blank to auto-generate)
            </label>
            <input
              className={adminInput}
              id="cat-slug"
              maxLength={120}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="reading-strategies"
              value={slug}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-(--admin-ink-soft)"
              htmlFor="cat-desc"
            >
              Short description
            </label>
            <textarea
              className={adminTextarea}
              id="cat-desc"
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              value={description}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold text-(--admin-ink-soft)"
              htmlFor="cat-order"
            >
              Display order
            </label>
            <input
              className={`${adminInput} max-w-28`}
              id="cat-order"
              min={0}
              onChange={(e) => setDisplayOrder(e.target.value)}
              type="number"
              value={displayOrder}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className={adminSecondary} onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className={`admin-primary-action inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-bold ${adminFocus}`}
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : "Save category"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
