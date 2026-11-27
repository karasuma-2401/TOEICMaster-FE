"use client";

import Link from "next/link";
import { getSession } from "@/features/auth/api";
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
  PageResult,
} from "@/features/knowledge/types";

export default function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: articleSlug } = use(params);
  return <KnowledgeArticle key={articleSlug} articleSlug={articleSlug} />;
}

function KnowledgeArticle({ articleSlug }: { articleSlug: string }) {
  const [article, setArticle] = useState<KnowledgeArticleDetail>();
  const [related, setRelated] = useState<KnowledgeArticleSummary[]>([]);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number>();

  useEffect(() => {
    const controller = new AbortController();
    const slug = encodeURIComponent(articleSlug);
    knowledgeRequest<KnowledgeArticleDetail>(
      `articles/${slug}`,
      "GET",
      controller.signal,
    )
      .then(async (value) => {
        if (controller.signal.aborted) return;
        setArticle(value);
        try {
          const session = await getSession();
          if (session.status === "guest" || controller.signal.aborted) return;
          setSignedIn(true);
          const page = await knowledgeRequest<PageResult<SavedArticle>>(
            `saved?articleId=${encodeURIComponent(value.id)}&pageNumber=1&pageSize=1`,
            "GET",
            controller.signal,
          );
          if (!controller.signal.aborted)
            setSaved(page.items.some((item) => item.articleId === value.id));
        } catch {
          /* Bookmark state must not prevent public article reading. */
        }
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setErrorStatus(cause instanceof KnowledgeApiError ? cause.status : 502);
        setNotice(
          cause instanceof Error ? cause.message : "Unable to open article.",
        );
      });
    knowledgeRequest<KnowledgeArticleSummary[]>(
      `articles/${slug}/related`,
      "GET",
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) setRelated(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [articleSlug]);

  async function toggleSaved() {
    if (!article || pending) return;
    if (!signedIn) {
      setNotice("Please sign in to save this article.");
      return;
    }
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

  if (!article)
    return errorStatus ? (
      <section
        role="alert"
        className="rounded-2xl border border-(--tm-border) bg-white p-8"
      >
        <h1 className="text-2xl font-bold">
          {errorStatus === 404 ? "Article not found" : "Unable to open article"}
        </h1>
        <p className="my-4">
          {errorStatus === 404
            ? "This article is unavailable or no longer published."
            : notice}
        </p>
        <Link
          className="font-semibold text-(--tm-brand) underline"
          href="/knowledge"
        >
          ← Knowledge Library
        </Link>
      </section>
    ) : (
      <output>Opening article…</output>
    );
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
