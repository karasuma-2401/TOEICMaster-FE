import type { KnowledgeTocItem, TiptapDoc, TiptapNode } from "./types";

export const EMPTY_TIPTAP_DOC: TiptapDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function slugifyVietnamese(source: string, maxLength = 80): string {
  const replaced = source
    .trim()
    .replaceAll("đ", "d")
    .replaceAll("Đ", "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  let slug = replaced.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(/-+$/g, "");
  }
  return slug;
}

function collectPlainText(node: TiptapNode): string {
  if (node.type === "text") return node.text ?? "";
  if (!Array.isArray(node.content)) return "";
  return node.content.map(collectPlainText).join("");
}

export function extractTocFromDoc(doc: TiptapDoc): KnowledgeTocItem[] {
  const toc: KnowledgeTocItem[] = [];
  const counts = new Map<string, number>();

  function walk(node: TiptapNode) {
    if (node.type === "heading") {
      const rawLevel =
        typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const level = Math.min(6, Math.max(1, rawLevel));
      const text = collectPlainText(node).trim();
      if (text.length > 0 && level <= 4) {
        const base = slugifyVietnamese(text, 80) || `section-${toc.length + 1}`;
        const prev = counts.get(base) ?? 0;
        const next = prev + 1;
        counts.set(base, next);
        toc.push({
          id: next === 1 ? base : `${base}-${next}`,
          level,
          text,
        });
      }
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child);
    }
  }

  for (const child of doc.content ?? []) walk(child);
  return toc;
}

export function estimateReadMinutes(doc: TiptapDoc): number {
  let words = 0;
  function walk(node: TiptapNode) {
    if (node.type === "text" && node.text) {
      const matches = node.text.trim().match(/\S+/g);
      if (matches) words += matches.length;
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child);
    }
  }
  for (const child of doc.content ?? []) walk(child);
  return Math.max(1, Math.ceil(words / 200));
}

const BACKEND_MEDIA_RE =
  /\/api\/v1\/(?:admin\/)?knowledge\/media\/([0-9a-f-]{36})/i;

export function normalizeMediaSrcForBff(
  src: string | null | undefined,
): string {
  if (!src) return "";
  const match = BACKEND_MEDIA_RE.exec(src);
  if (match) return `/api/admin/knowledge/media/${match[1]}`;
  return src;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDateTimeVi(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
