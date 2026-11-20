import { describe, expect, it } from "vitest";
import {
  estimateReadMinutes,
  extractTocFromDoc,
  normalizeMediaSrcForBff,
  slugifyVietnamese,
} from "./tiptap-utils";

describe("knowledge tiptap-utils", () => {
  it("slugifies Vietnamese diacritics and deduplicates heading anchors in TOC", () => {
    expect(slugifyVietnamese("Mẹo làm bài Đọc hiểu TOEIC!")).toBe(
      "meo-lam-bai-doc-hieu-toeic",
    );

    const toc = extractTocFromDoc({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Giới thiệu" }],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Giới thiệu" }],
        },
      ],
    });

    expect(toc).toEqual([
      { id: "gioi-thieu", level: 2, text: "Giới thiệu" },
      { id: "gioi-thieu-2", level: 3, text: "Giới thiệu" },
    ]);
  });

  it("estimates reading time and rewrites backend media URLs to same-origin BFF", () => {
    const minutes = estimateReadMinutes({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "word ".repeat(450) }],
        },
      ],
    });
    expect(minutes).toBe(3);

    const id = "11111111-2222-3333-4444-555555555555";
    expect(normalizeMediaSrcForBff(`/api/v1/admin/knowledge/media/${id}`)).toBe(
      `/api/admin/knowledge/media/${id}`,
    );
  });
});
