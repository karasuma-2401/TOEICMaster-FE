"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSpeakingTests } from "@/features/speaking/api";
import { getWritingTests } from "@/features/writing/attempt-api";
import { EmptyPanel } from "@/shared/components/practice/state-panels";
import {
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";

const maxFeatured = 4;

export interface FeaturedExam {
  id: string;
  title: string;
  meta: string;
  facts: string;
  href: string;
  publishedAtUtc: string;
}

async function loadFeatured(signal: AbortSignal) {
  // One skill failing should not empty the section.
  const [speaking, writing] = await Promise.all([
    getSpeakingTests(signal).catch(() => []),
    getWritingTests(signal, "", 1, maxFeatured)
      .then((page) => page.items)
      .catch(() => []),
  ]);
  return [
    ...speaking.map((test) => ({
      id: test.id,
      title: test.title,
      meta: "~20 phút · 11 câu · Speaking",
      facts: "5 Parts · 0–200 điểm",
      href: `/speaking/tests/${encodeURIComponent(test.id)}/practice?mode=full`,
      publishedAtUtc: test.publishedAtUtc ?? "",
    })),
    ...writing.map((test) => ({
      id: test.id,
      title: test.title,
      meta: "60 phút · 8 câu · Writing",
      facts: "3 Parts · 0–200 điểm",
      href: `/writing/tests/${encodeURIComponent(test.id)}?mode=full`,
      publishedAtUtc: test.publishedAtUtc,
    })),
  ]
    .toSorted((a, b) => b.publishedAtUtc.localeCompare(a.publishedAtUtc))
    .slice(0, maxFeatured);
}

/** Newest published tests across the skills that learners can take today. */
export function FeaturedExams() {
  const [exams, setExams] = useState<FeaturedExam[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => {
      void loadFeatured(controller.signal).then((items) => {
        if (!controller.signal.aborted) setExams(items);
      });
    }, 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, []);

  if (exams === null)
    return (
      <>
        <p className="sr-only">Đang tải đề thi nổi bật…</p>
        <div
          aria-hidden="true"
          className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {Array.from({ length: maxFeatured }, (_, index) => (
            <div
              className="h-[218px] animate-pulse rounded-[20px] bg-(--sp-subtle)"
              key={index}
            />
          ))}
        </div>
      </>
    );

  if (exams.length === 0)
    return (
      <EmptyPanel
        description="Đề mới sẽ xuất hiện ở đây ngay khi được công bố."
        title="Chưa có đề thi được công bố"
      />
    );

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {exams.map((exam, index) => (
        <article
          className="flex flex-col rounded-[20px] border border-(--sp-line)/70 bg-white p-5 transition hover:border-(--sp-hero-line) hover:shadow-(--sp-shadow-card)"
          key={exam.id}
        >
          <span className="w-fit rounded-md bg-(--sp-orange-soft) px-2.5 py-1 text-xs font-medium uppercase text-(--sp-brand)">
            {index === 0 ? "Mới nhất" : "Chuẩn format ETS"}
          </span>
          <h3 className="mt-3 text-xl font-semibold leading-7">{exam.title}</h3>
          <p className="mt-3 text-[15px] text-(--sp-ink-2)">{exam.meta}</p>
          <p className="mt-2 flex-1 text-[15px] text-(--sp-ink-2)">
            {exam.facts}
          </p>
          <div className="mt-4">
            <Link
              className={index === 0 ? primaryAction : secondaryAction}
              href={exam.href}
            >
              Làm bài ngay
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
