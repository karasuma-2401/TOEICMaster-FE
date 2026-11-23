"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { KnowledgeArticlePreview } from "@/features/knowledge/components/knowledge-article-preview";
import { KnowledgeApiError } from "@/features/knowledge/http";
import {
  knowledgeRequest,
  type SavedArticle,
} from "@/features/knowledge/public-api";
import type {
  KnowledgeArticleDetail,
  KnowledgeArticleSummary,
} from "@/features/knowledge/types";

export default function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: articleSlug } = use(params);
  const [article, setArticle] = useState<KnowledgeArticleDetail>();
  const [related, setRelated] = useState<KnowledgeArticleSummary[]>([]);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const slug = encodeURIComponent(articleSlug);
    knowledgeRequest<KnowledgeArticleDetail>(
      `articles/${slug}`,
      "GET",
      controller.signal,
    )
      .then((value) => {
        setArticle(value);
        knowledgeRequest<SavedArticle[]>("saved", "GET", controller.signal)
          .then((items) =>
            setSaved(items.some((item) => item.articleId === value.id)),
          )
          .catch(() => {});
      })
      .catch(
        (cause) =>
          !controller.signal.aborted &&
          setNotice(
            cause instanceof Error ? cause.message : "Unable to open article.",
          ),
      );
    knowledgeRequest<KnowledgeArticleSummary[]>(
      `articles/${slug}/related`,
      "GET",
      controller.signal,
    )
      .then(setRelated)
      .catch(() => {});
    return () => controller.abort();
  }, [articleSlug]);

  async function toggleSaved() {
    if (!article || pending) return;
    setPending(true);
    try {
      await knowledgeRequest(`saved/${article.id}`, saved ? "DELETE" : "PUT");
      setSaved(!saved);
      setNotice(
        saved
          ? "Removed from saved articles."
          : "Article saved to your profile.",
      );
    } catch (cause) {
      setNotice(
        cause instanceof KnowledgeApiError && cause.status === 401
          ? "Please sign in to save this article."
          : cause instanceof Error
            ? cause.message
            : "Unable to save article.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!article) return <output>{notice || "Opening article…"}</output>;
  return (
    <div className="knowledge-reading">
      <Link className="font-semibold text-[#c74422]" href="/knowledge">
        ← Knowledge Library
      </Link>
      <div className="knowledge-reading-toolbar">
        <p className="knowledge-reading-eyebrow">
          STUDY CORNER <span>/</span> {article.categoryName}
        </p>
        <button
          aria-pressed={saved}
          disabled={pending}
          className="knowledge-save-button"
          onClick={() => void toggleSaved()}
        >
          {pending ? "Saving…" : saved ? "♥ Saved" : "♡ Save article"}
        </button>
      </div>
      {notice && (
        <output className="knowledge-reading-notice">
          {notice}{" "}
          {notice.includes("sign in") && (
            <Link
              href={`/login?next=${encodeURIComponent(`/knowledge/${articleSlug}`)}`}
            >
              Sign in →
            </Link>
          )}
        </output>
      )}
      <div className="knowledge-reading-grid">
        <KnowledgeArticlePreview
          publicView
          {...article}
          tags={article.tags.map((tag) => tag.name)}
        />
        <aside className="knowledge-related">
          <span className="knowledge-related-index">UP NEXT / 01</span>
          <h2>Next Articles</h2>
          {related.length === 0 ? (
            <p className="mt-3 text-sm text-[#6b655f]">
              No related articles yet.
            </p>
          ) : (
            related.map((item) => (
              <article className="knowledge-related-item" key={item.id}>
                <Link
                  className="font-semibold"
                  href={`/knowledge/${item.slug}`}
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-[#6b655f]">{item.summary}</p>
              </article>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
