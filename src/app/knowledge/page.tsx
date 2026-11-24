"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { knowledgeRequest } from "@/features/knowledge/public-api";
import type {
  KnowledgeArticleSummary,
  KnowledgeCategory,
  PageResult,
} from "@/features/knowledge/types";

export default function KnowledgePage() {
  return (
    <Suspense fallback={<output>Loading articles…</output>}>
      <KnowledgeLibrary />
    </Suspense>
  );
}

function KnowledgeLibrary() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filters = searchParams.toString();
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [result, setResult] = useState<{
    key: string;
    data?: PageResult<KnowledgeArticleSummary>;
    error?: string;
  }>();
  const data = result?.key === filters ? result.data : undefined;
  const error = result?.key === filters ? result.error : undefined;

  useEffect(() => {
    const controller = new AbortController();
    knowledgeRequest<KnowledgeCategory[]>(
      "categories",
      "GET",
      controller.signal,
    )
      .then(setCategories)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    knowledgeRequest<PageResult<KnowledgeArticleSummary>>(
      `articles?${filters}`,
      "GET",
      controller.signal,
    )
      .then((page) => {
        if (!controller.signal.aborted) setResult({ key: filters, data: page });
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setResult({
            key: filters,
            error:
              cause instanceof Error
                ? cause.message
                : "Unable to load articles.",
          });
      });
    return () => controller.abort();
  }, [filters]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new URLSearchParams(filters);
    new FormData(event.currentTarget).forEach((value, key) => {
      if (String(value).trim()) values.set(key, String(value).trim());
      else values.delete(key);
    });
    values.set("pageNumber", "1");
    router.push(`/knowledge?${values}`);
  }

  function pageUrl(page: number) {
    const values = new URLSearchParams(filters);
    values.set("pageNumber", String(page));
    return `/knowledge?${values}`;
  }

  return (
    <>
      <section className="border-b border-[#ece9e5] pb-8">
        <p className="text-sm font-semibold text-(--tm-brand)">
          KNOWLEDGE LIBRARY
        </p>
        <h1 className="mt-2 text-4xl font-bold text-[#2f2b28]">
          Focused TOEIC Study
        </h1>
        <p className="mt-3 max-w-2xl text-[#6b655f]">
          Guides, sample responses, and study notes organized by skill.
        </p>
      </section>
      <form
        key={filters}
        className="my-6 flex flex-wrap gap-3"
        onSubmit={search}
      >
        <input
          aria-label="Search articles"
          className="min-w-56 flex-1 rounded-xl border border-[#d8d0c5] bg-white px-4 py-3"
          defaultValue={searchParams.get("q") ?? ""}
          name="q"
          placeholder="Search articles, guides…"
        />
        <select
          aria-label="Skill"
          className="rounded-xl border border-[#d8d0c5] bg-white px-3"
          defaultValue={searchParams.get("skill") ?? ""}
          name="skill"
        >
          <option value="">All skills</option>
          {["General", "Listening", "Reading", "Speaking", "Writing"].map(
            (skill) => (
              <option key={skill}>{skill}</option>
            ),
          )}
        </select>
        <select
          aria-label="Category"
          className="rounded-xl border border-[#d8d0c5] bg-white px-3"
          defaultValue={searchParams.get("categoryId") ?? ""}
          name="categoryId"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-xl bg-(--tm-brand) hover:bg-(--tm-brand-hover) px-5 py-3 font-semibold text-white"
          type="submit"
        >
          Search articles
        </button>
      </form>
      {error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <output>Loading articles…</output>
      ) : (
        <section>
          <p className="mb-4 text-sm text-[#6b655f]">
            {data.totalCount} {data.totalCount === 1 ? "article" : "articles"}{" "}
            for you
          </p>
          {data.items.length === 0 && (
            <div className="rounded-xl border border-(--tm-border) p-6">
              <h2 className="text-xl font-bold">No articles found</h2>
              <p className="my-2">
                Try another search or browse the full library.
              </p>
              <Link
                href="/knowledge"
                className="font-semibold text-(--tm-brand) underline"
              >
                Clear filters
              </Link>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((article) => (
              <article
                className="rounded-2xl border border-[#e6e0dc] bg-white p-5"
                key={article.id}
              >
                <p className="text-xs font-semibold text-(--tm-brand)">
                  {article.skill} · {article.categoryName}
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  <Link href={`/knowledge/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-3 line-clamp-3 text-sm text-[#6b655f]">
                  {article.summary}
                </p>
                <Link
                  className="mt-4 inline-block font-semibold text-(--tm-brand)"
                  href={`/knowledge/${article.slug}`}
                >
                  Read article →
                </Link>
              </article>
            ))}
          </div>
          {data.totalPages > 1 && (
            <nav
              aria-label="Article pages"
              className="mt-6 flex items-center gap-4"
            >
              {data.hasPreviousPage && (
                <Link href={pageUrl(data.pageNumber - 1)}>Previous page</Link>
              )}
              <span>
                Page {data.pageNumber} of {data.totalPages}
              </span>
              {data.hasNextPage && (
                <Link href={pageUrl(data.pageNumber + 1)}>Next page</Link>
              )}
            </nav>
          )}
        </section>
      )}
    </>
  );
}
