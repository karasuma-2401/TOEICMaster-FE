"use client";

import type { Editor } from "@tiptap/react";
import { useRef, useState } from "react";
import { toast } from "@/shared/ui/toast";

interface KnowledgeTiptapToolbarProps {
  editor: Editor | null;
  uploading: boolean;
  onDirectImageUpload: (file: File) => void;
  onOpenMediaPicker: () => void;
}

export function KnowledgeTiptapToolbar({
  editor,
  uploading,
  onDirectImageUpload,
  onOpenMediaPicker,
}: KnowledgeTiptapToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyLink() {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      return;
    }
    const isSafe =
      /^https?:\/\//i.test(trimmed) ||
      /^mailto:/i.test(trimmed) ||
      trimmed.startsWith("/") ||
      trimmed.startsWith("#");
    if (!isSafe) {
      toast.error("Link phải bắt đầu bằng https://, http://, mailto: hoặc /");
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
    setLinkOpen(false);
    setLinkUrl("");
  }

  const toolBtn = (active: boolean) =>
    `rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
      active
        ? "bg-(--admin-brand-red) text-white"
        : "text-(--admin-ink) hover:bg-(--admin-surface-muted)"
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 border-b border-(--admin-border) bg-(--admin-surface-muted) px-3 py-2">
        <button
          className={toolBtn(Boolean(editor?.isActive("paragraph")))}
          onClick={() => editor?.chain().focus().setParagraph().run()}
          type="button"
        >
          Đoạn văn
        </button>
        {([2, 3, 4] as const).map((level) => (
          <button
            className={toolBtn(Boolean(editor?.isActive("heading", { level })))}
            key={level}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level }).run()
            }
            type="button"
          >
            H{level}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-(--admin-border)" />

        <button
          className={toolBtn(Boolean(editor?.isActive("bold")))}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="In đậm"
          type="button"
        >
          B
        </button>
        <button
          className={`${toolBtn(Boolean(editor?.isActive("italic")))} italic`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="In nghiêng"
          type="button"
        >
          I
        </button>
        <button
          className={`${toolBtn(Boolean(editor?.isActive("strike")))} line-through`}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Gạch ngang"
          type="button"
        >
          S
        </button>
        <button
          className={toolBtn(Boolean(editor?.isActive("code")))}
          onClick={() => editor?.chain().focus().toggleCode().run()}
          title="Mã nội tuyến"
          type="button"
        >
          {"</>"}
        </button>

        <span className="mx-1 h-4 w-px bg-(--admin-border)" />

        <button
          className={toolBtn(Boolean(editor?.isActive("bulletList")))}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          type="button"
        >
          • Danh sách
        </button>
        <button
          className={toolBtn(Boolean(editor?.isActive("orderedList")))}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          type="button"
        >
          1. Đánh số
        </button>
        <button
          className={toolBtn(Boolean(editor?.isActive("blockquote")))}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          type="button"
        >
          “ Trích dẫn
        </button>
        <button
          className={toolBtn(false)}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          type="button"
        >
          ― Kẻ ngang
        </button>

        <span className="mx-1 h-4 w-px bg-(--admin-border)" />

        <button
          className={toolBtn(Boolean(editor?.isActive("link")) || linkOpen)}
          onClick={() => {
            const currentHref = editor?.getAttributes("link").href;
            setLinkUrl(typeof currentHref === "string" ? currentHref : "");
            setLinkOpen((prev) => !prev);
          }}
          type="button"
        >
          Gắn link
        </button>

        <input
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onDirectImageUpload(file);
          }}
          ref={fileInputRef}
          type="file"
        />
        <button
          className={toolBtn(false)}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {uploading ? "Đang tải ảnh..." : "+ Tải ảnh"}
        </button>
        <button
          className={toolBtn(false)}
          onClick={onOpenMediaPicker}
          type="button"
        >
          Thư viện ảnh
        </button>

        <span className="mx-1 h-4 w-px bg-(--admin-border)" />

        <button
          className={`${toolBtn(false)} disabled:opacity-40`}
          disabled={!editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
          type="button"
        >
          ↶
        </button>
        <button
          className={`${toolBtn(false)} disabled:opacity-40`}
          disabled={!editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
          type="button"
        >
          ↷
        </button>
      </div>

      {linkOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-(--admin-border) bg-(--admin-row-hover) px-4 py-2">
          <input
            className="min-w-60 flex-1 rounded-md border border-(--admin-border) bg-white px-2.5 py-1 text-xs outline-none focus:border-(--admin-brand-orange)"
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
            placeholder="Nhập URL (https://..., mailto:..., hoặc /...)"
            type="url"
            value={linkUrl}
          />
          <button
            className="admin-primary-action rounded-md px-3 py-1 text-xs font-bold"
            onClick={applyLink}
            type="button"
          >
            Áp dụng
          </button>
          <button
            className="rounded-md border border-(--admin-border) bg-white px-2.5 py-1 text-xs text-(--admin-ink-soft) hover:bg-(--admin-surface-muted)"
            onClick={() => {
              editor?.chain().focus().extendMarkRange("link").unsetLink().run();
              setLinkOpen(false);
              setLinkUrl("");
            }}
            type="button"
          >
            Bỏ link
          </button>
        </div>
      ) : null}
    </>
  );
}
