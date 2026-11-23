"use client";

import { useEffect, useState } from "react";
import { toast } from "@/shared/ui/toast";
import {
  deleteKnowledgeMedia,
  listKnowledgeMedia,
  toAdminBffMediaUrl,
} from "../admin-api";
import { KnowledgeApiError } from "../http";
import { formatBytes } from "../tiptap-utils";
import type { KnowledgeMediaAsset, PageResult } from "../types";
import {
  KnowledgeConfirmDialog,
  KnowledgePagination,
} from "./knowledge-ui-primitives";

interface KnowledgeMediaTabProps {
  refreshSignal: number;
}

export function KnowledgeMediaTab({ refreshSignal }: KnowledgeMediaTabProps) {
  const [query, setQuery] = useState("");
  const [unusedOnly, setUnusedOnly] = useState("all");
  const [sort, setSort] = useState("createdAt:desc");
  const [pageNumber, setPageNumber] = useState(1);
  const [data, setData] = useState<PageResult<KnowledgeMediaAsset> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [localTick, setLocalTick] = useState(0);
  const [confirmDeleteAsset, setConfirmDeleteAsset] =
    useState<KnowledgeMediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
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
            sort,
            pageNumber,
            pageSize: 16,
          },
          controller.signal,
        );
        if (active) setData(page);
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
  }, [localTick, pageNumber, query, refreshSignal, sort, unusedOnly]);

  async function confirmDelete() {
    if (!confirmDeleteAsset) return;
    setDeleting(true);
    try {
      await deleteKnowledgeMedia(confirmDeleteAsset.id);
      toast.success("Image deleted.");
      setConfirmDeleteAsset(null);
      setLocalTick((t) => t + 1);
    } catch (err) {
      toast.error(
        err instanceof KnowledgeApiError
          ? err.message
          : "Could not delete image.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const fieldClass =
    "h-10 rounded-xl border border-(--admin-border) bg-white px-3 text-sm text-(--admin-ink) outline-none transition focus:border-(--admin-brand-orange) focus:ring-4 focus:ring-orange-100";

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-(--admin-border) bg-(--admin-surface) p-4 sm:grid-cols-3">
        <input
          className={fieldClass}
          onChange={(e) => {
            setQuery(e.target.value);
            setPageNumber(1);
          }}
          placeholder="Search by image filename..."
          type="search"
          value={query}
        />
        <select
          aria-label="Filter images by usage status"
          className={fieldClass}
          onChange={(e) => {
            setUnusedOnly(e.target.value);
            setPageNumber(1);
          }}
          value={unusedOnly}
        >
          <option value="all">All images</option>
          <option value="used">Used in articles</option>
          <option value="unused">Unused (deletable)</option>
        </select>
        <select
          aria-label="Sort images"
          className={fieldClass}
          onChange={(e) => {
            setSort(e.target.value);
            setPageNumber(1);
          }}
          value={sort}
        >
          <option value="createdAt:desc">Newest uploads</option>
          <option value="fileName:asc">Filename A → Z</option>
          <option value="byteLength:desc">Largest file size</option>
        </select>
      </div>

      <div className="rounded-2xl border border-(--admin-border) bg-(--admin-surface) p-5 shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-(--admin-muted)">
            Loading media library...
          </p>
        ) : !data || data.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--admin-muted)">
            No images yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((asset) => {
              const used = (asset.usageCount ?? 0) > 0;
              return (
                <div
                  className="flex flex-col overflow-hidden rounded-xl border border-(--admin-border) bg-white"
                  key={asset.id}
                >
                  <div className="aspect-4/3 w-full overflow-hidden bg-(--admin-surface-muted)">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={asset.originalFileName}
                      className="h-full w-full object-cover"
                      src={toAdminBffMediaUrl(asset.id)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-2 p-3">
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
                          ? `In use (${asset.usageCount} article${asset.usageCount === 1 ? "" : "s"})`
                          : "Unused"}
                      </p>
                    </div>
                    <button
                      className="w-full cursor-pointer rounded-md border border-(--admin-border) bg-white py-1 text-xs font-semibold text-(--admin-danger) transition duration-150 hover:border-(--admin-danger) hover:bg-(--admin-danger) hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--admin-border) disabled:hover:bg-white disabled:hover:text-(--admin-danger)"
                      disabled={used}
                      onClick={() => setConfirmDeleteAsset(asset)}
                      title={
                        used
                          ? "Image is currently used in an article"
                          : "Remove image from library"
                      }
                      type="button"
                    >
                      {used ? "In use" : "Delete image"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data ? (
          <KnowledgePagination
            className="mt-5 border-t border-(--admin-border) pt-3"
            hasNextPage={data.hasNextPage}
            hasPreviousPage={data.hasPreviousPage}
            itemLabel="images"
            onPageChange={setPageNumber}
            pageNumber={data.pageNumber}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
          />
        ) : null}
      </div>

      <KnowledgeConfirmDialog
        confirmLabel="Delete image"
        description={`Are you sure you want to remove "${confirmDeleteAsset?.originalFileName ?? ""}" from the library?`}
        onCancel={() => setConfirmDeleteAsset(null)}
        onConfirm={() => void confirmDelete()}
        open={Boolean(confirmDeleteAsset)}
        pending={deleting}
        title="Confirm image deletion"
      />
    </section>
  );
}
