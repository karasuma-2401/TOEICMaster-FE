"use client";

import { useEffect, useRef, useState } from "react";
import {
  adminFocus,
  adminSecondary,
} from "@/features/admin/components/content/admin-styles";
import { toast } from "@/shared/ui/toast";
import {
  deleteKnowledgeMedia,
  listKnowledgeMedia,
  toAdminBffMediaUrl,
  uploadKnowledgeImage,
} from "../admin-api";
import { KnowledgeApiError } from "../http";
import { formatBytes } from "../tiptap-utils";
import type { KnowledgeMediaAsset } from "../types";
import { KnowledgePagination } from "./knowledge-ui-primitives";

interface KnowledgeMediaPickerModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (asset: KnowledgeMediaAsset) => void;
}

export function KnowledgeMediaPickerModal({
  open,
  title = "Choose image from library",
  onClose,
  onSelect,
}: KnowledgeMediaPickerModalProps) {
  const [query, setQuery] = useState("");
  const [unusedOnly, setUnusedOnly] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [items, setItems] = useState<KnowledgeMediaAsset[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let active = true;
    async function run() {
      try {
        const page = await listKnowledgeMedia(
          {
            query: query.trim() || undefined,
            unusedOnly:
              unusedOnly === "unused"
                ? true
                : unusedOnly === "used"
                  ? false
                  : undefined,
            pageNumber,
            pageSize: 12,
          },
          controller.signal,
        );
        if (!active) return;
        setItems(page.items);
        setTotalPages(page.totalPages);
        setTotalCount(page.totalCount);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        toast.error(
          err instanceof Error ? err.message : "Could not load media library.",
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
  }, [open, pageNumber, query, unusedOnly, reloadTick]);

  if (!open) return null;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadKnowledgeImage(file);
      toast.success("Image uploaded successfully.");
      onSelect(uploaded);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not upload image.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset: KnowledgeMediaAsset) {
    setDeletingId(asset.id);
    try {
      await deleteKnowledgeMedia(asset.id);
      toast.success("Image removed from library.");
      setLoading(true);
      setReloadTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Could not delete image.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <dialog
      aria-label={title}
      aria-modal="true"
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/50 p-4"
      open
    >
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--admin-border) bg-(--admin-surface) shadow-2xl">
        <div className="flex items-center justify-between border-b border-(--admin-border) px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-(--admin-ink)">{title}</h2>
            <p className="text-xs text-(--admin-muted)">
              PNG, JPEG, or WebP up to 5 MiB ({totalCount} images in library)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleUpload}
              ref={fileInputRef}
              type="file"
            />
            <button
              className={`admin-primary-action inline-flex h-10 items-center justify-center rounded-lg px-3.5 text-sm font-bold ${adminFocus}`}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {uploading ? "Uploading..." : "+ Upload image"}
            </button>
            <button
              aria-label="Close media library"
              className={`${adminSecondary} h-10 px-3`}
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-(--admin-border) bg-(--admin-surface-muted) px-6 py-3">
          <input
            className="min-w-55 flex-1 rounded-xl border border-(--admin-border) bg-white px-3 py-1.5 text-sm text-(--admin-ink) outline-none transition focus:border-(--admin-brand-orange) focus:ring-4 focus:ring-orange-100"
            onChange={(e) => {
              setQuery(e.target.value);
              setPageNumber(1);
            }}
            placeholder="Search by image filename..."
            type="search"
            value={query}
          />
          <select
            aria-label="Filter by image usage status"
            className="rounded-xl border border-(--admin-border) bg-white px-3 py-1.5 text-sm text-(--admin-ink) outline-none transition focus:border-(--admin-brand-orange) focus:ring-4 focus:ring-orange-100"
            onChange={(e) => {
              setUnusedOnly(e.target.value);
              setPageNumber(1);
            }}
            value={unusedOnly}
          >
            <option value="all">All images</option>
            <option value="used">In use</option>
            <option value="unused">Unused</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="py-12 text-center text-sm text-(--admin-muted)">
              Loading media library...
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--admin-border) py-12 text-center">
              <p className="text-sm text-(--admin-muted)">
                No matching images found. Upload a new image.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((asset) => {
                const url = toAdminBffMediaUrl(asset.id);
                const used = (asset.usageCount ?? 0) > 0;
                return (
                  <div
                    className="group flex flex-col overflow-hidden rounded-xl border border-(--admin-border) bg-white transition hover:border-(--admin-brand-red)"
                    key={asset.id}
                  >
                    <button
                      className="relative aspect-4/3 w-full overflow-hidden bg-(--admin-surface-muted) text-left"
                      onClick={() => {
                        onSelect(asset);
                        onClose();
                      }}
                      type="button"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={asset.originalFileName}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        src={url}
                      />
                    </button>
                    <div className="flex flex-1 flex-col justify-between gap-2 p-2.5">
                      <div>
                        <p
                          className="truncate text-xs font-semibold text-(--admin-ink)"
                          title={asset.originalFileName}
                        >
                          {asset.originalFileName}
                        </p>
                        <p className="text-[11px] text-(--admin-muted)">
                          {formatBytes(asset.byteLength)} -{" "}
                          {used
                            ? `Used in ${asset.usageCount} article${asset.usageCount === 1 ? "" : "s"}`
                            : "Unused"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          className="flex-1 rounded-md bg-(--admin-nav-active) px-2 py-1 text-xs font-semibold text-(--admin-brand-red) hover:bg-(--admin-brand-red) hover:text-white"
                          onClick={() => {
                            onSelect(asset);
                            onClose();
                          }}
                          type="button"
                        >
                          Select
                        </button>
                        <button
                          className="rounded-md border border-(--admin-border) px-2 py-1 text-xs text-(--admin-danger) hover:bg-(--admin-danger-soft) disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={used || deletingId === asset.id}
                          onClick={() => void handleDelete(asset)}
                          title={
                            used
                              ? "Image is currently used in an article"
                              : "Delete unused image"
                          }
                          type="button"
                        >
                          {deletingId === asset.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <KnowledgePagination
          className="border-t border-(--admin-border) px-6 py-3"
          hasNextPage={pageNumber < totalPages}
          hasPreviousPage={pageNumber > 1}
          itemLabel="images"
          onPageChange={setPageNumber}
          pageNumber={pageNumber}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </div>
    </dialog>
  );
}
