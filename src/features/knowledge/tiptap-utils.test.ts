import { describe, expect, it } from "vitest";
import {
  estimateReadMinutes,
  extractTocFromDoc,
  isSafeKnowledgeHref,
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

  it("allows only safe knowledge href schemes and anchors", () => {
    expect(isSafeKnowledgeHref("https://toeicmaster.vn/lessons")).toBe(true);
    expect(isSafeKnowledgeHref("HTTP://example.com/guide")).toBe(true);
    expect(isSafeKnowledgeHref("mailto:support@toeicmaster.vn")).toBe(true);
    expect(isSafeKnowledgeHref("/knowledge/part-5")).toBe(true);
    expect(isSafeKnowledgeHref("#section-2")).toBe(true);
    expect(isSafeKnowledgeHref("  https://example.com/trimmed  ")).toBe(true);

    expect(isSafeKnowledgeHref("")).toBe(false);
    expect(isSafeKnowledgeHref("   ")).toBe(false);
    expect(isSafeKnowledgeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeKnowledgeHref("  JaVaScRiPt:alert(1)")).toBe(false);
    expect(isSafeKnowledgeHref("\u0001\tjavascript:alert(1)")).toBe(false);
    expect(isSafeKnowledgeHref("java\tscript:alert(1)")).toBe(false);
    expect(
      isSafeKnowledgeHref("DATA:text/html,<script>alert(1)</script>"),
    ).toBe(false);
    expect(isSafeKnowledgeHref("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeKnowledgeHref("//evil.com/phish")).toBe(false);
    expect(isSafeKnowledgeHref("/\t/evil.com/phish")).toBe(false);
    expect(isSafeKnowledgeHref("/\\evil.com/phish")).toBe(false);
  });

  it("sanitizes fallback media URLs in normalizeMediaSrcForBff", () => {
    const id = "11111111-2222-3333-4444-555555555555";
    expect(
      normalizeMediaSrcForBff(
        `https://api.example.com/api/v1/knowledge/media/${id}`,
      ),
    ).toBe(`/api/admin/knowledge/media/${id}`);
    expect(normalizeMediaSrcForBff("https://cdn.example.com/diagram.png")).toBe(
      "https://cdn.example.com/diagram.png",
    );
    expect(normalizeMediaSrcForBff("http://cdn.example.com/diagram.png")).toBe(
      "http://cdn.example.com/diagram.png",
    );
    expect(normalizeMediaSrcForBff("/images/sample.png")).toBe(
      "/images/sample.png",
    );

    expect(normalizeMediaSrcForBff(null)).toBe("");
    expect(normalizeMediaSrcForBff(undefined)).toBe("");
    expect(normalizeMediaSrcForBff("   ")).toBe("");
    expect(normalizeMediaSrcForBff("javascript:alert(1)")).toBe("");
    expect(normalizeMediaSrcForBff("  JaVaScRiPt:alert(1)")).toBe("");
    expect(normalizeMediaSrcForBff("DATA:image/svg+xml,<svg/>")).toBe("");
    expect(normalizeMediaSrcForBff("//evil.com/tracker.png")).toBe("");
    expect(normalizeMediaSrcForBff("/\t/evil.com/tracker.png")).toBe("");
    expect(normalizeMediaSrcForBff("mailto:user@example.com")).toBe("");
  });
});
