"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { knowledgeRequest, type SavedArticle } from "../public-api";

export function SavedLessons() {
  const [items, setItems] = useState<SavedArticle[]>();

  useEffect(() => {
    const controller = new AbortController();
    knowledgeRequest<SavedArticle[]>("saved", "GET", controller.signal)
      .then(setItems)
      .catch(() => setItems([]));
    return () => controller.abort();
  }, []);

  async function remove(articleId: string) {
    await knowledgeRequest(`saved/${articleId}`, "DELETE");
    setItems((previous) =>
      previous?.filter((item) => item.articleId !== articleId),
    );
  }

  return (
    <section id="saved-lessons" className="scroll-mt-24">
      <h2 className="text-2xl font-bold">Saved Lessons</h2>
      {!items ? (
        <output>Loading saved lessons...</output>
      ) : items.length === 0 ? (
        <p className="mt-3 text-[#6b655f]">
          No saved lessons yet.{" "}
          <Link className="text-[#c74422] underline" href="/knowledge">
            Explore library →
          </Link>
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-xl bg-white px-5">
          {items.map((item) => (
            <li
              className="flex items-center justify-between gap-4 py-4"
              key={item.articleId}
            >
              {item.available ? (
                <Link className="font-semibold hover:underline" href={item.url}>
                  {item.title}
                </Link>
              ) : (
                <span>{item.title}</span>
              )}
              <button
                className="text-sm text-[#a83d21]"
                onClick={() => void remove(item.articleId)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
