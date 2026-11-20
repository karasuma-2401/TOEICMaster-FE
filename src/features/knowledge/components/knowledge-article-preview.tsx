"use client";

import type { ReactNode } from "react";
import { toAdminBffMediaUrl } from "../admin-api";
import "../knowledge-editor.css";
import {
  estimateReadMinutes,
  extractTocFromDoc,
  isKnowledgeMediaUuid,
  normalizeMediaSrcForBff,
  sanitizeKnowledgeHref,
} from "../tiptap-utils";
import type {
  KnowledgeArticleStatus,
  KnowledgeSkill,
  TiptapDoc,
  TiptapNode,
} from "../types";

interface KnowledgeArticlePreviewProps {
  title: string;
  summary: string;
  skill: KnowledgeSkill;
  categoryName: string;
  status: KnowledgeArticleStatus;
  coverImageAssetId: string | null;
  coverImageAlt: string | null;
  tags: string[];
  content: TiptapDoc;
}

function renderTextWithMarks(node: TiptapNode, key: string): ReactNode {
  let element: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold")
      element = <strong key={`${key}-b`}>{element}</strong>;
    else if (mark.type === "italic")
      element = <em key={`${key}-i`}>{element}</em>;
    else if (mark.type === "strike")
      element = <s key={`${key}-s`}>{element}</s>;
    else if (mark.type === "code")
      element = <code key={`${key}-c`}>{element}</code>;
    else if (mark.type === "link") {
      const rawHref =
        typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
      const safeHref = sanitizeKnowledgeHref(rawHref);
      if (safeHref !== null) {
        element = (
          <a
            href={safeHref}
            key={`${key}-a`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {element}
          </a>
        );
      }
    }
  }
  return <span key={key}>{element}</span>;
}

export function KnowledgeArticlePreview({
  title,
  summary,
  skill,
  categoryName,
  status,
  coverImageAssetId,
  coverImageAlt,
  tags,
  content,
}: KnowledgeArticlePreviewProps) {
  const toc = extractTocFromDoc(content);
  const readMinutes = estimateReadMinutes(content);
  let headingIndex = 0;

  function renderNode(node: TiptapNode, key: string): ReactNode {
    const children = (node.content ?? []).map((child, idx) =>
      renderNode(child, `${key}-${idx}`),
    );

    switch (node.type) {
      case "text":
        return renderTextWithMarks(node, key);
      case "paragraph":
        return <p key={key}>{children.length > 0 ? children : <br />}</p>;
      case "heading": {
        const level =
          typeof node.attrs?.level === "number" ? node.attrs.level : 2;
        const anchor = level <= 4 ? toc[headingIndex++]?.id : undefined;
        if (level === 2)
          return (
            <h2 id={anchor} key={key}>
              {children}
            </h2>
          );
        if (level === 3)
          return (
            <h3 id={anchor} key={key}>
              {children}
            </h3>
          );
        return (
          <h4 id={anchor} key={key}>
            {children}
          </h4>
        );
      }
      case "bulletList":
        return <ul key={key}>{children}</ul>;
      case "orderedList":
        return <ol key={key}>{children}</ol>;
      case "listItem":
        return <li key={key}>{children}</li>;
      case "blockquote":
        return <blockquote key={key}>{children}</blockquote>;
      case "codeBlock":
        return (
          <pre key={key}>
            <code>{children}</code>
          </pre>
        );
      case "horizontalRule":
        return <hr key={key} />;
      case "hardBreak":
        return <br key={key} />;
      case "table": {
        const rows = node.content ?? [];
        const hasHeaderRow =
          rows.length > 0 &&
          (rows[0].content ?? []).some((cell) => cell.type === "tableHeader");
        const headRows = hasHeaderRow ? rows.slice(0, 1) : [];
        const bodyRows = hasHeaderRow ? rows.slice(1) : rows;
        return (
          <div className="kn-table-wrap" key={key}>
            <table>
              {headRows.length > 0 ? (
                <thead>
                  {headRows.map((row, idx) =>
                    renderNode(row, `${key}-h-${idx}`),
                  )}
                </thead>
              ) : null}
              <tbody>
                {bodyRows.map((row, idx) => renderNode(row, `${key}-b-${idx}`))}
              </tbody>
            </table>
          </div>
        );
      }
      case "tableRow":
        return <tr key={key}>{children}</tr>;
      case "tableHeader": {
        const colSpan =
          typeof node.attrs?.colspan === "number" && node.attrs.colspan > 1
            ? node.attrs.colspan
            : undefined;
        const rowSpan =
          typeof node.attrs?.rowspan === "number" && node.attrs.rowspan > 1
            ? node.attrs.rowspan
            : undefined;
        return (
          <th colSpan={colSpan} key={key} rowSpan={rowSpan}>
            {children}
          </th>
        );
      }
      case "tableCell": {
        const colSpan =
          typeof node.attrs?.colspan === "number" && node.attrs.colspan > 1
            ? node.attrs.colspan
            : undefined;
        const rowSpan =
          typeof node.attrs?.rowspan === "number" && node.attrs.rowspan > 1
            ? node.attrs.rowspan
            : undefined;
        return (
          <td colSpan={colSpan} key={key} rowSpan={rowSpan}>
            {children}
          </td>
        );
      }
      case "image": {
        const assetId =
          typeof node.attrs?.assetId === "string"
            ? node.attrs.assetId.trim()
            : null;
        const rawSrc =
          typeof node.attrs?.src === "string" ? node.attrs.src : "";
        const src =
          assetId && isKnowledgeMediaUuid(assetId)
            ? toAdminBffMediaUrl(assetId)
            : normalizeMediaSrcForBff(rawSrc);
        const alt =
          typeof node.attrs?.alt === "string"
            ? node.attrs.alt
            : "Hình ảnh bài viết";
        if (!src) return null;
        return (
          <figure className="my-4" key={key}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={alt} src={src} />
            {alt ? (
              <figcaption className="mt-1.5 text-center text-xs text-(--admin-muted)">
                {alt}
              </figcaption>
            ) : null}
          </figure>
        );
      }
      default:
        return children.length > 0 ? <div key={key}>{children}</div> : null;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-(--admin-warning)/25 bg-(--admin-warning-soft) px-4 py-2.5 text-xs font-medium text-(--admin-warning)">
        <span>
          Chế độ xem trước Admin (Preview Mode) — Hiển thị giống bố cục bài báo
          hoàn thiện dành cho Học viên.
        </span>
        <span className="rounded-full bg-white/80 px-2.5 py-0.5 font-semibold">
          Trạng thái: {status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-2xl border border-(--admin-border) bg-(--admin-surface) p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-(--admin-nav-active) px-3 py-1 text-(--admin-brand-red)">
              {skill}
            </span>
            {categoryName ? (
              <span className="rounded-full bg-(--admin-surface-muted) px-3 py-1 text-(--admin-ink-soft)">
                {categoryName}
              </span>
            ) : null}
            <span className="text-(--admin-muted)">
              · {readMinutes} phút đọc
            </span>
          </div>

          <h1 className="text-2xl font-extrabold leading-tight text-(--admin-ink) sm:text-3xl">
            {title.trim() || "Chưa có tiêu đề bài viết"}
          </h1>

          {summary.trim() ? (
            <p className="mt-3 text-base leading-relaxed text-(--admin-ink-soft)">
              {summary}
            </p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  className="rounded-md border border-(--admin-border) bg-(--admin-surface-muted) px-2.5 py-0.5 text-xs text-(--admin-ink-soft)"
                  key={tag}
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {coverImageAssetId &&
          isKnowledgeMediaUuid(coverImageAssetId.trim()) ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-(--admin-border)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={coverImageAlt || title}
                className="max-h-95 w-full object-cover"
                src={toAdminBffMediaUrl(coverImageAssetId.trim())}
              />
            </div>
          ) : null}

          <div className="kn-prose mt-6 border-t border-(--admin-border) pt-6">
            {(content.content ?? []).map((node, idx) =>
              renderNode(node, `root-${idx}`),
            )}
          </div>
        </article>

        <aside className="h-fit rounded-2xl border border-(--admin-border) bg-(--admin-surface) p-5 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-(--admin-muted)">
            Mục lục bài viết
          </h2>
          {toc.length === 0 ? (
            <p className="mt-3 text-xs text-(--admin-muted)">
              Thêm tiêu đề H2, H3 hoặc H4 trong trình soạn thảo để tự động sinh
              mục lục cuộn nhanh.
            </p>
          ) : (
            <nav aria-label="Mục lục bài viết" className="mt-3 space-y-1.5">
              {toc.map((item) => (
                <button
                  className={`block w-full rounded-md px-2 py-1 text-left text-xs text-(--admin-ink-soft) transition hover:bg-(--admin-nav-active) hover:text-(--admin-brand-red) ${
                    item.level === 3
                      ? "pl-5"
                      : item.level >= 4
                        ? "pl-8"
                        : "font-semibold"
                  }`}
                  key={item.id}
                  onClick={() => {
                    document
                      .getElementById(item.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  type="button"
                >
                  {item.text}
                </button>
              ))}
            </nav>
          )}
        </aside>
      </div>
    </div>
  );
}
