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

function ToolbarIcon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
      viewBox="0 0 24 24"
    >
      <path d={d} />
    </svg>
  );
}

export function KnowledgeTiptapToolbar({
  editor,
  uploading,
  onDirectImageUpload,
  onOpenMediaPicker,
}: KnowledgeTiptapToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("2");
  const [tableWithHeader, setTableWithHeader] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function insertCustomTable() {
    if (!editor) return;
    const rows = Math.min(20, Math.max(1, Number.parseInt(tableRows, 10) || 3));
    const cols = Math.min(10, Math.max(1, Number.parseInt(tableCols, 10) || 2));
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: tableWithHeader })
      .run();
    setTableOpen(false);
  }

  const inTable = Boolean(editor?.isActive("table"));

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
    `inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-bold transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
      active
        ? "bg-(--admin-brand-red) text-white shadow-xs"
        : "text-(--admin-ink-soft) hover:bg-(--admin-nav-active)/80 hover:text-(--admin-brand-red)"
    }`;

  return (
    <div className="sticky top-14 z-20 rounded-t-xl bg-(--admin-surface)/95 shadow-xs backdrop-blur-xs">
      <div className="flex flex-wrap items-center gap-1 rounded-t-xl border-b border-(--admin-border) bg-(--admin-surface-muted) px-3 py-2">
        <button
          aria-label="Đoạn văn thường"
          className={toolBtn(Boolean(editor?.isActive("paragraph")))}
          onClick={() => editor?.chain().focus().setParagraph().run()}
          title="Đoạn văn thường"
          type="button"
        >
          <ToolbarIcon d="M13 4v16m4-16v16M13 4H9.5a4.5 4.5 0 0 0 0 9H13" />
        </button>
        {([2, 3, 4] as const).map((level) => (
          <button
            aria-label={`Tiêu đề H${level}`}
            className={toolBtn(Boolean(editor?.isActive("heading", { level })))}
            key={level}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level }).run()
            }
            title={`Tiêu đề H${level} (tự động đưa vào mục lục)`}
            type="button"
          >
            H{level}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-(--admin-border)" />

        <button
          aria-label="In đậm"
          className={toolBtn(Boolean(editor?.isActive("bold")))}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="In đậm (Ctrl+B)"
          type="button"
        >
          <ToolbarIcon d="M7 5h6a3.5 3.5 0 0 1 0 7H7V5Zm0 7h7a3.5 3.5 0 0 1 0 7H7v-7Z" />
        </button>
        <button
          aria-label="In nghiêng"
          className={toolBtn(Boolean(editor?.isActive("italic")))}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="In nghiêng (Ctrl+I)"
          type="button"
        >
          <ToolbarIcon d="M19 4h-9m4 16H5M15 4 9 20" />
        </button>
        <button
          aria-label="Gạch ngang chữ"
          className={toolBtn(Boolean(editor?.isActive("strike")))}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Gạch ngang chữ"
          type="button"
        >
          <ToolbarIcon d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6m-2-8h16" />
        </button>
        <button
          aria-label="Mã nội tuyến"
          className={toolBtn(Boolean(editor?.isActive("code")))}
          onClick={() => editor?.chain().focus().toggleCode().run()}
          title="Mã nội tuyến (Code)"
          type="button"
        >
          <ToolbarIcon d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
        </button>

        <span className="mx-1 h-4 w-px bg-(--admin-border)" />

        <button
          aria-label="Danh sách gạch đầu dòng"
          className={toolBtn(Boolean(editor?.isActive("bulletList")))}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Danh sách gạch đầu dòng"
          type="button"
        >
          <ToolbarIcon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </button>
        <button
          aria-label="Danh sách đánh số"
          className={toolBtn(Boolean(editor?.isActive("orderedList")))}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Danh sách đánh số"
          type="button"
        >
          <ToolbarIcon d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 18h2a1 1 0 0 0 0-2H4v-2h3" />
        </button>
        <button
          aria-label="Khối trích dẫn"
          className={toolBtn(Boolean(editor?.isActive("blockquote")))}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          title="Khối trích dẫn / ghi chú nổi bật"
          type="button"
        >
          <ToolbarIcon d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.667-1.333 4.333-4 5m14-7h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.667-1.333 4.333-4 5" />
        </button>
        <button
          aria-label="Đường kẻ ngang phân cách"
          className={toolBtn(false)}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          title="Chèn đường kẻ ngang phân cách"
          type="button"
        >
          <ToolbarIcon d="M4 12h16" />
        </button>

        <span className="mx-1 h-4 w-px bg-(--admin-border)" />

        <button
          aria-label="Gắn hoặc sửa liên kết"
          className={toolBtn(Boolean(editor?.isActive("link")) || linkOpen)}
          onClick={() => {
            const currentHref = editor?.getAttributes("link").href;
            setLinkUrl(typeof currentHref === "string" ? currentHref : "");
            setTableOpen(false);
            setLinkOpen((prev) => !prev);
          }}
          title="Gắn liên kết (Link)"
          type="button"
        >
          <ToolbarIcon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </button>
        <button
          aria-label="Chèn bảng nhiều dòng nhiều cột"
          className={toolBtn(inTable || tableOpen)}
          onClick={() => {
            setLinkOpen(false);
            setTableOpen((prev) => !prev);
          }}
          title="Chèn bảng (Table)"
          type="button"
        >
          <ToolbarIcon d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm0 5h18M3 15h18M9 3v18M15 3v18" />
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
          aria-label="Tải ảnh mới từ máy"
          className={toolBtn(false)}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          title={uploading ? "Đang tải ảnh lên..." : "Tải ảnh mới từ máy"}
          type="button"
        >
          <ToolbarIcon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7-5-5-5 5m5-5v12" />
        </button>
        <button
          aria-label="Chọn ảnh từ thư viện"
          className={toolBtn(false)}
          onClick={onOpenMediaPicker}
          title="Chọn ảnh từ thư viện Media"
          type="button"
        >
          <ToolbarIcon d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm5.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 15l-5-5L5 21" />
        </button>

        <span className="mx-1 h-4 w-px bg-(--admin-border)" />

        <button
          aria-label="Hoàn tác"
          className={toolBtn(false)}
          disabled={!editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
          title="Hoàn tác (Ctrl+Z)"
          type="button"
        >
          <ToolbarIcon d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </button>
        <button
          aria-label="Làm lại"
          className={toolBtn(false)}
          disabled={!editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
          title="Làm lại (Ctrl+Y)"
          type="button"
        >
          <ToolbarIcon d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
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
            className="admin-primary-action cursor-pointer rounded-md px-3 py-1 text-xs font-bold"
            onClick={applyLink}
            type="button"
          >
            Áp dụng
          </button>
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2.5 py-1 text-xs text-(--admin-ink-soft) hover:bg-(--admin-surface-muted)"
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

      {tableOpen ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-(--admin-border) bg-(--admin-row-hover) px-4 py-2 text-xs">
          <label className="flex items-center gap-1.5 font-semibold text-(--admin-ink-soft)">
            Số dòng
            <input
              className="w-16 rounded-md border border-(--admin-border) bg-white px-2 py-1 text-xs outline-none focus:border-(--admin-brand-orange)"
              max={20}
              min={1}
              onChange={(e) => setTableRows(e.target.value)}
              type="number"
              value={tableRows}
            />
          </label>
          <label className="flex items-center gap-1.5 font-semibold text-(--admin-ink-soft)">
            Số cột
            <input
              className="w-16 rounded-md border border-(--admin-border) bg-white px-2 py-1 text-xs outline-none focus:border-(--admin-brand-orange)"
              max={10}
              min={1}
              onChange={(e) => setTableCols(e.target.value)}
              type="number"
              value={tableCols}
            />
          </label>
          <label className="flex items-center gap-1.5 text-(--admin-ink-soft)">
            <input
              checked={tableWithHeader}
              onChange={(e) => setTableWithHeader(e.target.checked)}
              type="checkbox"
            />
            Có dòng tiêu đề
          </label>
          <button
            className="admin-primary-action cursor-pointer rounded-md px-3 py-1 text-xs font-bold"
            onClick={insertCustomTable}
            type="button"
          >
            Chèn bảng
          </button>
        </div>
      ) : null}

      {inTable ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-(--admin-border) bg-(--admin-surface-muted)/60 px-3 py-1.5 text-xs">
          <span className="mr-1 font-semibold text-(--admin-muted)">
            Thao tác bảng:
          </span>
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2 py-1 text-(--admin-ink) transition hover:bg-(--admin-surface-muted)"
            onClick={() => editor?.chain().focus().addRowBefore().run()}
            type="button"
          >
            + Dòng trên
          </button>
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2 py-1 text-(--admin-ink) transition hover:bg-(--admin-surface-muted)"
            onClick={() => editor?.chain().focus().addRowAfter().run()}
            type="button"
          >
            + Dòng dưới
          </button>
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2 py-1 text-(--admin-danger) transition hover:bg-(--admin-danger-soft)"
            onClick={() => editor?.chain().focus().deleteRow().run()}
            type="button"
          >
            - Xóa dòng
          </button>
          <span className="mx-0.5 h-3.5 w-px bg-(--admin-border)" />
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2 py-1 text-(--admin-ink) transition hover:bg-(--admin-surface-muted)"
            onClick={() => editor?.chain().focus().addColumnBefore().run()}
            type="button"
          >
            + Cột trái
          </button>
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2 py-1 text-(--admin-ink) transition hover:bg-(--admin-surface-muted)"
            onClick={() => editor?.chain().focus().addColumnAfter().run()}
            type="button"
          >
            + Cột phải
          </button>
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2 py-1 text-(--admin-danger) transition hover:bg-(--admin-danger-soft)"
            onClick={() => editor?.chain().focus().deleteColumn().run()}
            type="button"
          >
            - Xóa cột
          </button>
          <span className="mx-0.5 h-3.5 w-px bg-(--admin-border)" />
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2 py-1 text-(--admin-ink-soft) transition hover:bg-(--admin-surface-muted)"
            onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
            type="button"
          >
            Đổi dòng tiêu đề
          </button>
          <button
            className="cursor-pointer rounded-md border border-(--admin-border) bg-white px-2 py-1 text-(--admin-danger) transition hover:bg-(--admin-danger-soft)"
            onClick={() => editor?.chain().focus().deleteTable().run()}
            type="button"
          >
            Xóa bảng
          </button>
        </div>
      ) : null}
    </div>
  );
}
