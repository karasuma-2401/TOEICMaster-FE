"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { knowledgeRequest, type SavedArticle } from "../public-api";
import type { PageResult } from "../types";

export function SavedLessons() {
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const key = `${page}:${reload}`;
  const [result, setResult] = useState<{
    key: string;
    data?: PageResult<SavedArticle>;
    error?: string;
  }>();
  const data = result?.key === key ? result.data : undefined;
  const error = result?.key === key ? result.error : undefined;
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    knowledgeRequest<PageResult<SavedArticle>>(
      `saved?pageNumber=${page}&pageSize=12`,
      "GET",
      controller.signal,
    )
      .then((value) => {
        if (controller.signal.aborted) return;
        if (value.items.length === 0 && page > 1) setPage(page - 1);
        else setResult({ key, data: value });
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error:
              cause instanceof Error
                ? cause.message
                : "Unable to load saved lessons.",
          });
      });
    return () => controller.abort();
  }, [page, key]);

  async function remove(articleId: string) {
    if (pending) return;
    setPending(true);
    try {
      await knowledgeRequest(`saved/${articleId}`, "DELETE");
      setReload((value) => value + 1);
    } catch (cause) {
      setResult({
        key,
        data,
        error:
          cause instanceof Error
            ? cause.message
            : "Unable to remove saved lesson.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="saved-lessons" className="scroll-mt-24">
      <h2 className="text-2xl font-bold">Saved Lessons</h2>
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setReload((value) => value + 1)}>
            Try again
          </button>
        </p>
      )}
      {!data ? (
        error ? null : (
          <output>Loading saved lessons...</output>
        )
      ) : data.items.length === 0 ? (
        <p className="mt-3 text-[#6b655f]">
          No saved lessons yet.{" "}
          <Link className="text-[#c74422] underline" href="/knowledge">
            Explore library →
          </Link>
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-xl bg-white px-5">
          {data.items.map((item) => (
            <li
              className="flex items-center justify-between gap-4 py-4"
              key={item.articleId}
            >
              {item.available && item.url ? (
                <Link className="font-semibold hover:underline" href={item.url}>
                  {item.title}
                </Link>
              ) : (
                <span>{item.title}</span>
              )}
              <button
                disabled={pending}
                className="text-sm text-[#a83d21]"
                onClick={() => void remove(item.articleId)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && data.totalPages > 1 && (
        <nav
          aria-label="Saved lesson pages"
          className="mt-4 flex items-center gap-4"
        >
          <button
            disabled={!data.hasPreviousPage || pending}
            onClick={() => setPage(page - 1)}
          >
            Previous page
          </button>
          <span>
            Page {data.pageNumber} of {data.totalPages}
          </span>
          <button
            disabled={!data.hasNextPage || pending}
            onClick={() => setPage(page + 1)}
          >
            Next page
          </button>
        </nav>
      )}
    </section>
  );
}
