"use client";

import { useState } from "react";
import { uploadSpeakingImage } from "@/features/speaking/admin-api";
import { mediaUrl } from "@/features/speaking/parsers";
import { errorMessage } from "./admin-load-state";

const maxBytes = 5 * 1024 * 1024;

/** Uploads a Part 2 picture immediately and reports the new asset id. */
export function ImageUploadField({
  imageUrl,
  onUploaded,
}: {
  imageUrl: string | null;
  onUploaded: (assetId: string, url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Chỉ nhận ảnh JPG hoặc PNG.");
      return;
    }
    if (file.size > maxBytes) {
      setError("Ảnh không được vượt quá 5MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { id } = await uploadSpeakingImage(file);
      onUploaded(id, mediaUrl("admin", id));
    } catch (cause) {
      setError(errorMessage(cause, "Không thể tải ảnh lên."));
    } finally {
      setUploading(false);
    }
  };
  return (
    <div>
      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 text-sm font-bold text-[var(--admin-brand-red)]">
        Hình ảnh đề bài *
        <span className="mt-1 block font-normal text-[var(--admin-muted)]">
          {uploading
            ? "Đang tải ảnh lên…"
            : imageUrl
              ? "Đã có ảnh · chọn file khác để thay"
              : "Chọn ảnh JPG/PNG, tối đa 5MB"}
        </span>
        <input
          accept="image/jpeg,image/png"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => void upload(event.target.files?.[0])}
          type="file"
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
