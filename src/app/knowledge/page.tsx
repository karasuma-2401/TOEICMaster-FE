"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { knowledgeRequest } from "@/features/knowledge/public-api";
import type {
  KnowledgeArticleSummary,
  KnowledgeCategory,
  PageResult,
} from "@/features/knowledge/types";

export default function KnowledgePage() {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState("");
  const [data, setData] = useState<PageResult<KnowledgeArticleSummary>>();
  const [error, setError] = useState("");

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
      .then(setData)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Không thể tải bài học.",
          );
      });
    return () => controller.abort();
  }, [filters]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => {
      if (String(value).trim()) values.set(key, String(value).trim());
    });
    setQuery(values.toString());
    setFilters(values.toString());
    setError("");
    setData(undefined);
  }

  return (
    <>
      <section className="border-b border-[#ece9e5] pb-8">
        <p className="text-sm font-semibold text-[#df5a28]">
          THƯ VIỆN KIẾN THỨC
        </p>
        <h1 className="mt-2 text-4xl font-bold text-[#2f2b28]">
          Học đúng trọng tâm TOEIC
        </h1>
        <p className="mt-3 max-w-2xl text-[#6b655f]">
          Tài liệu, bài làm mẫu và kiến thức theo từng kỹ năng.
        </p>
      </section>
      <form className="my-6 flex flex-wrap gap-3" onSubmit={search}>
        <input
          aria-label="Tìm bài học"
          className="min-w-56 flex-1 rounded-xl border border-[#d8d0c5] bg-white px-4 py-3"
          defaultValue={query}
          name="q"
          placeholder="Tìm kiến thức, tài liệu…"
        />
        <select
          aria-label="Kỹ năng"
          className="rounded-xl border border-[#d8d0c5] bg-white px-3"
          name="skill"
        >
          <option value="">Mọi kỹ năng</option>
          {["General", "Listening", "Reading", "Speaking", "Writing"].map(
            (skill) => (
              <option key={skill}>{skill}</option>
            ),
          )}
        </select>
        <select
          aria-label="Danh mục"
          className="rounded-xl border border-[#d8d0c5] bg-white px-3"
          name="categoryId"
        >
          <option value="">Mọi danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-xl bg-[#df5a28] px-5 py-3 font-semibold text-white"
          type="submit"
        >
          Tìm bài học
        </button>
      </form>
      {error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <output>Đang tải bài học…</output>
      ) : (
        <section>
          <p className="mb-4 text-sm text-[#6b655f]">
            {data.totalCount} bài học dành cho bạn
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((article) => (
              <article
                className="rounded-2xl border border-[#e6e0dc] bg-white p-5"
                key={article.id}
              >
                <p className="text-xs font-semibold text-[#df5a28]">
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
                  className="mt-4 inline-block font-semibold text-[#c74422]"
                  href={`/knowledge/${article.slug}`}
                >
                  Đọc bài học →
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
