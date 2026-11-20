"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
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
  title = "Chọn hình ảnh từ thư viện",
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
          err instanceof Error ? err.message : "Không thể tải thư viện ảnh.",
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
      toast.success("Đã tải lên hình ảnh thành công.");
      onSelect(uploaded);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tải lên hình ảnh.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset: KnowledgeMediaAsset) {
    setDeletingId(asset.id);
    try {
      await deleteKnowledgeMedia(asset.id);
      toast.success("Đã xóa hình ảnh khỏi thư viện.");
      setLoading(true);
      setReloadTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Không thể xóa hình ảnh.",
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
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--sp-line) bg-(--sp-surface) shadow-2xl">
        <div className="flex items-center justify-between border-b border-(--sp-line) px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-(--sp-ink)">{title}</h2>
            <p className="text-xs text-(--sp-ink-2)">
              PNG, JPEG hoặc WebP tối đa 5 MiB ({totalCount} ảnh trong thư viện)
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
              className="rounded-lg bg-(--sp-brand) px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {uploading ? "Đang tải lên..." : "+ Tải ảnh mới"}
            </button>
            <button
              aria-label="Đóng thư viện ảnh"
              className="rounded-lg border border-(--sp-line) px-3 py-2 text-sm text-(--sp-ink-2) hover:bg-(--sp-subtle)"
              onClick={onClose}
              type="button"
            >
              Đóng
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-(--sp-line) bg-(--sp-subtle) px-6 py-3">
          <input
            className="min-w-55 flex-1 rounded-lg border border-(--sp-input-line) bg-white px-3 py-1.5 text-sm outline-none focus:border-(--sp-brand)"
            onChange={(e) => {
              setQuery(e.target.value);
              setPageNumber(1);
            }}
            placeholder="Tìm theo tên file ảnh..."
            type="search"
            value={query}
          />
          <select
            aria-label="Lọc trạng thái sử dụng ảnh"
            className="rounded-lg border border-(--sp-input-line) bg-white px-3 py-1.5 text-sm"
            onChange={(e) => {
              setUnusedOnly(e.target.value);
              setPageNumber(1);
            }}
            value={unusedOnly}
          >
            <option value="all">Tất cả ảnh</option>
            <option value="used">Đang được dùng</option>
            <option value="unused">Chưa được dùng</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="py-12 text-center text-sm text-(--sp-ink-2)">
              Đang tải thư viện ảnh...
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--sp-line) py-12 text-center">
              <p className="text-sm text-(--sp-ink-2)">
                Chưa có hình ảnh nào phù hợp. Hãy tải ảnh mới lên.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((asset) => {
                const url = toAdminBffMediaUrl(asset.id);
                const used = (asset.usageCount ?? 0) > 0;
                return (
                  <div
                    className="group flex flex-col overflow-hidden rounded-xl border border-(--sp-line) bg-white transition hover:border-(--sp-brand)"
                    key={asset.id}
                  >
                    <button
                      className="relative aspect-4/3 w-full overflow-hidden bg-(--sp-subtle) text-left"
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
                          className="truncate text-xs font-semibold text-(--sp-ink)"
                          title={asset.originalFileName}
                        >
                          {asset.originalFileName}
                        </p>
                        <p className="text-[11px] text-(--sp-ink-3)">
                          {formatBytes(asset.byteLength)} ·{" "}
                          {used
                            ? `Dùng trong ${asset.usageCount} bài`
                            : "Chưa dùng"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          className="flex-1 rounded-md bg-(--sp-orange-soft) px-2 py-1 text-xs font-semibold text-(--sp-brand) hover:bg-(--sp-brand) hover:text-white"
                          onClick={() => {
                            onSelect(asset);
                            onClose();
                          }}
                          type="button"
                        >
                          Chọn
                        </button>
                        <button
                          className="rounded-md border border-(--sp-line) px-2 py-1 text-xs text-(--sp-danger) hover:bg-(--sp-danger-bg) disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={used || deletingId === asset.id}
                          onClick={() => void handleDelete(asset)}
                          title={
                            used
                              ? "Ảnh đang được sử dụng trong bài viết"
                              : "Xóa ảnh chưa dùng"
                          }
                          type="button"
                        >
                          {deletingId === asset.id ? "..." : "Xóa"}
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
          className="border-t border-(--sp-line) px-6 py-3"
          hasNextPage={pageNumber < totalPages}
          hasPreviousPage={pageNumber > 1}
          itemLabel="ảnh"
          onPageChange={setPageNumber}
          pageNumber={pageNumber}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </div>
    </dialog>
  );
}
