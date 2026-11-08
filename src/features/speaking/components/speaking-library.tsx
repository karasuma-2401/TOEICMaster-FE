"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSpeakingAttempts,
  getSpeakingTests,
  type SpeakingAttemptSummary,
  type SpeakingTestSummary,
} from "@/features/speaking/api";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { speakingParts } from "@/features/speaking/types";
import { formatMinutes } from "@/shared/ui/format-time";
import { FilterPills, SearchField } from "./ui/filters";
import { ArrowRightIcon, CheckIcon } from "./ui/icons";
import { SpPage } from "./ui/page";
import { Pagination } from "./ui/pagination";
import { SpEmpty, SpError, SpLoading } from "./ui/primitives";

const pageSize = 6;

const testHref = (test: SpeakingTestSummary) =>
  `/speaking/tests/${encodeURIComponent(test.id)}/practice?mode=full`;

function meta(test: SpeakingTestSummary) {
  const questions = test.parts.reduce(
    (sum, part) => sum + part.questionCount,
    0,
  );
  const seconds = test.parts.reduce(
    (sum, part) => sum + part.durationSeconds,
    0,
  );
  return `${questions} câu · ~${formatMinutes(seconds)} · 5 Parts`;
}

export function SpeakingLibrary() {
  const [tests, setTests] = useState<SpeakingTestSummary[]>([]);
  const [attempts, setAttempts] = useState<SpeakingAttemptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [done, setDone] = useState<"ALL" | "TODO" | "DONE">("ALL");
  const [sort, setSort] = useState<"NEW" | "OLD">("NEW");
  const [page, setPage] = useState(1);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [nextTests, nextAttempts] = await Promise.all([
        getSpeakingTests(signal),
        // Results are an extra: the list stays usable without them.
        getSpeakingAttempts(signal).catch(() => []),
      ]);
      setTests(nextTests);
      setAttempts(nextAttempts);
    } catch (cause) {
      if (signal?.aborted) return;
      setError(
        cause instanceof Error ? cause.message : "Không thể tải đề Speaking.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load]);

  const results = useMemo(() => {
    const byTest = new Map<string, { done: boolean; best: number | null }>();
    for (const attempt of attempts) {
      if (!attempt.testId || attempt.status !== "SUBMITTED") continue;
      const current = byTest.get(attempt.testId);
      const scores = [current?.best, attempt.estimatedScore].filter(
        (value): value is number => typeof value === "number",
      );
      byTest.set(attempt.testId, {
        done: true,
        best: scores.length ? Math.max(...scores) : null,
      });
    }
    return byTest;
  }, [attempts]);
  const bestOverall = [...results.values()].reduce<number | null>(
    (best, item) =>
      item.best !== null && (best === null || item.best > best)
        ? item.best
        : best,
    null,
  );

  const needle = query.trim().toLocaleLowerCase("vi-VN");
  const filtered = tests
    .filter((test) =>
      `${test.title} ${test.code}`.toLocaleLowerCase("vi-VN").includes(needle),
    )
    .filter((test) => {
      const isDone = results.get(test.id)?.done ?? false;
      return done === "ALL" || (done === "DONE") === isDone;
    })
    .toSorted((a, b) => {
      const order = (a.publishedAtUtc ?? "").localeCompare(
        b.publishedAtUtc ?? "",
      );
      return sort === "NEW" ? -order : order;
    });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const first = filtered.length ? (current - 1) * pageSize + 1 : 0;
  const last = Math.min(current * pageSize, filtered.length);

  const nextTest = tests.find((test) => !results.get(test.id)?.done);

  return (
    <SpPage>
      <section className="relative overflow-hidden rounded-[20px] bg-(--sp-ink) p-8 text-white md:p-10">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 size-80 rounded-full bg-(--sp-brand) opacity-30 blur-3xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="sp-overline text-(--sp-amber)">TOEIC SPEAKING</p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.15] tracking-[-0.01em] md:text-[48px]">
              Luyện nói như
              <br />
              đang ở phòng thi thật
            </h1>
            <p className="mt-3 text-white/70">
              11 câu · 5 Parts · Thang 0–200. Nhận đánh giá AI theo 5 tiêu chí
              ngay sau khi nộp bài.
            </p>
            {nextTest && (
              <Link
                className="sp-btn sp-btn-cta sp-btn-lg mt-6"
                href={testHref(nextTest)}
              >
                Làm {nextTest.title} <ArrowRightIcon size={18} />
              </Link>
            )}
          </div>
          {bestOverall !== null && (
            <div className="rounded-2xl bg-white/10 px-6 py-5 backdrop-blur">
              <p className="sp-overline text-white/60">THÀNH TÍCH CAO NHẤT</p>
              <p className="mt-1 text-[44px] font-bold leading-none">
                {bestOverall}
                <span className="text-xl font-medium text-white/60">
                  {" "}
                  / 200
                </span>
              </p>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="speaking-parts" className="mt-10">
        <h2 className="text-2xl font-bold" id="speaking-parts">
          Luyện theo Part
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {speakingParts.map((part) => (
            <Link
              className="sp-focus group rounded-2xl border border-(--sp-line) bg-(--sp-surface) p-4 transition hover:-translate-y-0.5 hover:border-(--sp-brand)"
              href={`/speaking/parts/${part}`}
              key={part}
            >
              <span className="text-[13px] font-semibold text-(--sp-brand)">
                Part {part}
              </span>
              <span className="mt-1 block font-semibold leading-snug">
                {speakingPartSpecs[part].title}
              </span>
              <span className="mt-1 block text-xs text-(--sp-ink-2)">
                {speakingPartSpecs[part].subtitle}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="speaking-tests" className="mt-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-2xl font-bold" id="speaking-tests">
            Đề thi thử
          </h2>
          <span className="text-[13px] text-(--sp-ink-2)">
            {filtered.length} đề
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SearchField
            label="Tìm kiếm tên đề Speaking"
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Tìm theo tên hoặc mã đề…"
            value={query}
          />
          <FilterPills
            label="Trạng thái"
            onChange={(value) => {
              setDone(value);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "Tất cả" },
              { value: "TODO", label: "Chưa làm" },
              { value: "DONE", label: "Đã làm" },
            ]}
            value={done}
          />
          <FilterPills
            label="Sắp xếp"
            onChange={setSort}
            options={[
              { value: "NEW", label: "Mới nhất" },
              { value: "OLD", label: "Cũ nhất" },
            ]}
            value={sort}
          />
        </div>

        <div className="mt-5">
          {loading && <SpLoading label="Đang tải đề Speaking…" />}
          {error && <SpError message={error} onRetry={() => void load()} />}
          {!loading && !error && tests.length === 0 && (
            <SpEmpty
              description="Admin cần tạo và công bố một đề đủ 11 câu cho 5 Part."
              title="Chưa có đề Speaking được công bố"
            />
          )}
          {!loading && !error && tests.length > 0 && filtered.length === 0 && (
            <SpEmpty
              description="Thử đổi từ khóa hoặc bộ lọc trạng thái."
              title="Không tìm thấy đề phù hợp"
            />
          )}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((test) => {
              const result = results.get(test.id);
              return (
                <article
                  className="sp-card flex flex-col p-6 transition hover:-translate-y-0.5 hover:border-(--sp-hero-line)"
                  key={test.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-(--sp-ink-3)">
                      {test.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${result?.done ? "text-(--sp-success)" : "text-(--sp-ink-3)"}`}
                    >
                      {result?.done && <CheckIcon size={14} />}
                      {result?.done ? "Đã làm" : "Chưa làm"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-bold leading-7">
                    {test.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-(--sp-ink-2)">
                    {meta(test)}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-(--sp-line) pt-4">
                    <span className="text-[13px] text-(--sp-ink-2)">
                      {result?.best != null ? (
                        <>
                          Tốt nhất{" "}
                          <b className="text-base font-bold text-(--sp-brand)">
                            {result.best}
                          </b>
                          /200
                        </>
                      ) : (
                        "Chưa có điểm"
                      )}
                    </span>
                    <Link className="sp-btn sp-btn-cta" href={testHref(test)}>
                      {result?.done ? "Thi lại" : "Vào thi"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {filtered.length > pageSize && (
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-(--sp-ink-2)">
              Hiển thị {first}–{last} trong {filtered.length} đề
            </p>
            <Pagination onPage={setPage} page={current} pages={pages} />
          </footer>
        )}
      </section>
    </SpPage>
  );
}
