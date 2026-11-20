"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { listKnowledgeCategories, uploadKnowledgeImage } from "../admin-api";
import type { KnowledgeCategory } from "../types";
import { KnowledgeArticlesTab } from "./knowledge-articles-tab";
import { KnowledgeCategoriesTab } from "./knowledge-categories-tab";
import { KnowledgeCategoryModal } from "./knowledge-category-modal";
import { KnowledgeMediaTab } from "./knowledge-media-tab";

type Tab = "articles" | "categories" | "media";

export function KnowledgeAdminHub() {
  const [tab, setTab] = useState<Tab>("articles");
  const [allCategories, setAllCategories] = useState<KnowledgeCategory[]>([]);
  const [categoriesTick, setCategoriesTick] = useState(0);
  const [mediaTick, setMediaTick] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<KnowledgeCategory | null>(null);
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
        // Non-blocking for article filter dropdown
      }
    }
    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [categoriesTick]);

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
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
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
        <KnowledgeArticlesTab categories={allCategories} />
      ) : null}

      {tab === "categories" ? (
        <KnowledgeCategoriesTab
          onChanged={() => setCategoriesTick((t) => t + 1)}
          onEdit={(category) => {
            setEditingCategory(category);
            setCategoryModalOpen(true);
          }}
          refreshSignal={categoriesTick}
        />
      ) : null}

      {tab === "media" ? <KnowledgeMediaTab refreshSignal={mediaTick} /> : null}

      {categoryModalOpen ? (
        <KnowledgeCategoryModal
          editingCategory={editingCategory}
          onClose={() => setCategoryModalOpen(false)}
          onSaved={() => setCategoriesTick((t) => t + 1)}
        />
      ) : null}
    </div>
  );
}
