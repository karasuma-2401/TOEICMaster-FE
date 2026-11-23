"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/content/admin-page-header";
import { adminFocus } from "@/features/admin/components/content/admin-styles";
import { AdminUnderlineTabs } from "@/features/admin/components/content/content-tabs";
import { toast } from "@/shared/ui/toast";
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
      toast.success("New image uploaded.");
      setMediaTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not upload image.",
      );
    } finally {
      setMediaUploading(false);
    }
  }

  const primaryActionClass = `admin-primary-action inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-bold ${adminFocus}`;

  const headerAction =
    tab === "categories" ? (
      <button
        className={primaryActionClass}
        onClick={() => {
          setEditingCategory(null);
          setCategoryModalOpen(true);
        }}
        type="button"
      >
        + New category
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
          className={primaryActionClass}
          disabled={mediaUploading}
          onClick={() => mediaUploadRef.current?.click()}
          type="button"
        >
          {mediaUploading ? "Uploading..." : "+ Upload image"}
        </button>
      </>
    ) : (
      <Link className={primaryActionClass} href="/admin/knowledge/new">
        + New article
      </Link>
    );

  return (
    <div>
      <AdminPageHeader
        actions={headerAction}
        description="Write, categorize, preview, and publish TOEIC study guide articles for learners."
        eyebrow="ADMIN / KNOWLEDGE"
        title="Knowledge & Study Guides"
      />

      <AdminUnderlineTabs
        activeId={tab}
        ariaLabel="Knowledge admin sections"
        items={[
          { id: "articles", label: "Articles" },
          { id: "categories", label: `Categories (${allCategories.length})` },
          { id: "media", label: "Media Library" },
        ]}
        onSelect={setTab}
      />

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
