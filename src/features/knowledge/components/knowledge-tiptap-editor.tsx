"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import toast from "react-hot-toast";
import { toAdminBffMediaUrl, uploadKnowledgeImage } from "../admin-api";
import "../knowledge-editor.css";
import type { KnowledgeMediaAsset, TiptapDoc } from "../types";
import { KnowledgeMediaPickerModal } from "./knowledge-media-picker-modal";

interface KnowledgeTiptapEditorProps {
  value: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
}

const KnowledgeImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      assetId: {
        default: null,
      },
    };
  },
});

export function KnowledgeTiptapEditor({
  value,
  onChange,
}: KnowledgeTiptapEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSerializedRef = useRef<string>(JSON.stringify(value));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      KnowledgeImageExtension.configure({
        inline: false,
      }),
      Placeholder.configure({
        placeholder:
          "Bắt đầu viết nội dung bài kiến thức TOEIC... Dùng tiêu đề H2/H3 để tự tạo bảng mục lục.",
      }),
    ],
    content: value,
    onUpdate({ editor: instance }) {
      const json = instance.getJSON() as TiptapDoc;
      lastSerializedRef.current = JSON.stringify(json);
      onChange(json);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(value);
    if (incoming !== lastSerializedRef.current) {
      lastSerializedRef.current = incoming;
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  function insertAsset(asset: KnowledgeMediaAsset) {
    if (!editor) return;
    const src = toAdminBffMediaUrl(asset.id);
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          src,
          alt: asset.originalFileName,
          assetId: asset.id,
        },
      })
      .run();
  }

  async function handleDirectImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadKnowledgeImage(file);
      insertAsset(asset);
      toast.success("Đã chèn hình ảnh vào bài viết.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tải lên hình ảnh.",
      );
    } finally {
      setUploading(false);
    }
  }

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
        ? "bg-(--sp-brand) text-white"
        : "text-(--sp-ink) hover:bg-(--sp-subtle)"
    }`;

  return (
    <div className="overflow-hidden rounded-xl border border-(--sp-input-line) bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-(--sp-line) bg-(--sp-subtle) px-3 py-2">
        <button
          className={toolBtn(Boolean(editor?.isActive("paragraph")))}
          onClick={() => editor?.chain().focus().setParagraph().run()}
          type="button"
        >
          Đoạn văn
        </button>
        <button
          className={toolBtn(
            Boolean(editor?.isActive("heading", { level: 2 })),
          )}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          type="button"
        >
          H2
        </button>
        <button
          className={toolBtn(
            Boolean(editor?.isActive("heading", { level: 3 })),
          )}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          type="button"
        >
          H3
        </button>
        <button
          className={toolBtn(
            Boolean(editor?.isActive("heading", { level: 4 })),
          )}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 4 }).run()
          }
          type="button"
        >
          H4
        </button>

        <span className="mx-1 h-4 w-px bg-(--sp-line)" />

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

        <span className="mx-1 h-4 w-px bg-(--sp-line)" />

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

        <span className="mx-1 h-4 w-px bg-(--sp-line)" />

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
          onChange={handleDirectImageUpload}
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
          onClick={() => setMediaPickerOpen(true)}
          type="button"
        >
          Thư viện ảnh
        </button>

        <span className="mx-1 h-4 w-px bg-(--sp-line)" />

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
        <div className="flex flex-wrap items-center gap-2 border-b border-(--sp-line) bg-(--sp-cream) px-4 py-2">
          <input
            className="min-w-60 flex-1 rounded-md border border-(--sp-input-line) bg-white px-2.5 py-1 text-xs outline-none focus:border-(--sp-brand)"
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
            className="rounded-md bg-(--sp-brand) px-3 py-1 text-xs font-semibold text-white"
            onClick={applyLink}
            type="button"
          >
            Áp dụng
          </button>
          <button
            className="rounded-md border border-(--sp-line) bg-white px-2.5 py-1 text-xs text-(--sp-ink-2)"
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

      <div className="kn-prose px-5 py-4">
        <EditorContent editor={editor} />
      </div>

      <KnowledgeMediaPickerModal
        onClose={() => setMediaPickerOpen(false)}
        onSelect={insertAsset}
        open={mediaPickerOpen}
        title="Chèn hình ảnh vào bài viết"
      />
    </div>
  );
}
