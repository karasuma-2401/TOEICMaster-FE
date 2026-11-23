"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/shared/ui/toast";
import { toAdminBffMediaUrl, uploadKnowledgeImage } from "../admin-api";
import "../knowledge-editor.css";
import type { KnowledgeMediaAsset, TiptapDoc } from "../types";
import { KnowledgeMediaPickerModal } from "./knowledge-media-picker-modal";
import { KnowledgeTiptapToolbar } from "./knowledge-tiptap-toolbar";

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
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder:
          "Start writing your TOEIC knowledge article... Use H2/H3 headings to auto-generate the table of contents.",
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
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          src: toAdminBffMediaUrl(asset.id),
          alt: asset.originalFileName,
          assetId: asset.id,
        },
      })
      .run();
  }

  async function handleDirectImageUpload(file: File) {
    setUploading(true);
    try {
      const asset = await uploadKnowledgeImage(file);
      insertAsset(asset);
      toast.success("Image inserted into article.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not upload image.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-(--admin-border) bg-white">
      <KnowledgeTiptapToolbar
        editor={editor}
        onDirectImageUpload={(file) => void handleDirectImageUpload(file)}
        onOpenMediaPicker={() => setMediaPickerOpen(true)}
        uploading={uploading}
      />

      <div className="kn-prose rounded-b-xl px-5 py-4">
        <EditorContent editor={editor} />
      </div>

      <KnowledgeMediaPickerModal
        onClose={() => setMediaPickerOpen(false)}
        onSelect={insertAsset}
        open={mediaPickerOpen}
        title="Insert image into article"
      />
    </div>
  );
}
