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
  disabled = false,
}: {
  imageUrl: string | null;
  onUploaded: (assetId: string, url: string) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPG or PNG images are accepted.");
      return;
    }
    if (file.size > maxBytes) {
      setError("Image must not exceed 5MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { id } = await uploadSpeakingImage(file);
      onUploaded(id, mediaUrl("admin", id));
    } catch (cause) {
      setError(errorMessage(cause, "Unable to upload image."));
    } finally {
      setUploading(false);
    }
  };
  return (
    <div>
      <label
        className={`block rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 text-sm font-bold text-[var(--admin-brand-red)] ${disabled ? "cursor-not-allowed opacity-65" : "cursor-pointer"}`}
      >
        Prompt image *
        <span className="mt-1 block font-normal text-[var(--admin-muted)]">
          {uploading
            ? "Uploading image..."
            : imageUrl
              ? "Image uploaded · choose another file to replace"
              : "Choose JPG/PNG image, max 5MB"}
        </span>
        <input
          accept="image/jpeg,image/png"
          className="sr-only"
          disabled={disabled || uploading}
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
