"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import {
  fetchUnifiedHistory,
  type ExamSkillType,
  type UnifiedAttemptItem,
} from "@/features/history/api";
import { focusRing } from "@/shared/components/practice/styles";

const skillMeta: Record<
  ExamSkillType,
  { label: string; badge: string; status: string }
> = {
  lr: {
    label: "L&R",
    badge: "bg-[#EFF6FF] text-[#1D4ED8]",
    status: "Listening & Reading",
  },
  speaking: {
    label: "Speaking",
    badge: "bg-[#FAF5FF] text-[#7E22CE]",
    status: "Speaking",
  },
  writing: {
    label: "Writing",
    badge: "bg-[#ECFDF5] text-[#047857]",
    status: "Writing",
  },
};

const statusMeta = {
  IN_PROGRESS: { label: "Đang làm", tone: "bg-[#FEF3C7] text-[#B45309]" },
  COMPLETED: { label: "Đã nộp", tone: "bg-[#ECFDF5] text-[#047857]" },
  ABANDONED: { label: "Bỏ dở", tone: "bg-[#F1F5F9] text-[#475569]" },
} as const;

const filters: { value: "ALL" | ExamSkillType; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "lr", label: "L&R" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
];

function formatMoment(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function evaluationLabel(item: UnifiedAttemptItem) {
  if (!item.evaluationStatus) return null;
  if (item.evaluationStatus === "COMPLETED") return "AI đã chấm";
  if (item.evaluationStatus === "FAILED") return "AI chấm thất bại";
  return "AI đang chấm";
}

function AttemptCard({ item }: { item: UnifiedAttemptItem }) {
  const skill = skillMeta[item.skill];
  const status = statusMeta[item.status];
  const evaluation = evaluationLabel(item);

  return (
    <article className="flex flex-col rounded-2xl border border-[#EEE9E6] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${skill.badge}`}
        >
          {skill.label}
        </span>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${status.tone}`}
        >
          {status.label}
        </span>
      </div>
      <h4 className="mt-3 text-lg leading-6 font-semibold text-[#2F2B28]">
        {item.title}
      </h4>
      <p className="mt-1 text-[13px] text-[#6B655F]">
        {item.code ? `${item.code} · ` : ""}
        {item.modeLabel}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className="font-semibold text-[#2F2B28]">
          {item.score === null
            ? "Chưa có điểm"
            : `${item.score} / ${item.maxScore}`}
        </span>
        <span className="text-[#6B655F]">
          {formatMoment(item.timestampUtc)}
        </span>
      </div>
      {item.subScoreLabel || evaluation ? (
        <p className="mt-1 text-xs text-[#6B655F]">
          {[item.subScoreLabel, evaluation].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.resumeHref ? (
          <Link
            className={`inline-flex min-h-9 items-center rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-3.5 text-[13px] font-semibold text-white ${focusRing}`}
            href={item.resumeHref}
          >
            Tiếp tục làm bài
          </Link>
        ) : null}
        {item.resultHref ? (
          <Link
            className={`inline-flex min-h-9 items-center rounded-lg border border-[#E2E8F0] px-3.5 text-[13px] font-semibold text-[#3D3935] hover:bg-[#FAF7F5] ${focusRing}`}
            href={item.resultHref}
          >
            Xem kết quả
          </Link>
        ) : null}
        {item.reviewHref ? (
          <Link
            className={`inline-flex min-h-9 items-center rounded-lg px-3.5 text-[13px] font-semibold text-[#C2410C] underline underline-offset-4 ${focusRing}`}
            href={item.reviewHref}
          >
            Xem lại
          </Link>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Cross-skill attempt cards reused on `/`, every skill library, `/history` and
 * `/profile`. Fetches only the configured skills so a guest page never calls
 * more APIs than needed.
 */
export function AttemptHistorySection({
  skills,
  limit,
  showFilter = false,
  showSummary = false,
  showViewAll = false,
  title,
  description,
}: {
  skills?: ExamSkillType[];
  /** Initial number of cards; omit to show every attempt. */
  limit?: number;
  showFilter?: boolean;
  showSummary?: boolean;
  showViewAll?: boolean;
  /** Section heading; omit when the page already renders the heading. */
  title?: string;
  description?: string;
}) {
  const headingId = useId();
  const [items, setItems] = useState<UnifiedAttemptItem[]>([]);
  const [unauthenticatedSkills, setUnauthenticatedSkills] = useState<
    ExamSkillType[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | ExamSkillType>("ALL");
  const [visibleCount, setVisibleCount] = useState(
    limit ?? Number.MAX_SAFE_INTEGER,
  );
  const skillsKey = skills?.join(",") ?? "";

  useEffect(() => {
    const controller = new AbortController();
    const selected = skillsKey
      ? (skillsKey.split(",") as ExamSkillType[])
      : undefined;
    const task = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void fetchUnifiedHistory({ skills: selected, signal: controller.signal })
        .then((result) => {
          if (controller.signal.aborted) return;
          setItems(result.items);
          setUnauthenticatedSkills(result.unauthenticatedSkills);
          setLoading(false);
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải lịch sử làm bài.",
          );
          setLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [skillsKey]);

  const requestedSkills = skills ?? ["lr", "speaking", "writing"];
  const isGuest =
    unauthenticatedSkills.length > 0 &&
    requestedSkills.every((skill) => unauthenticatedSkills.includes(skill));

  const filtered = useMemo(
    () =>
      filter === "ALL" ? items : items.filter((item) => item.skill === filter),
    [items, filter],
  );
  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  const summary = useMemo(() => {
    const completed = items.filter((item) => item.status === "COMPLETED");
    const scored = completed.filter((item) => item.score !== null);
    const best = scored.reduce<UnifiedAttemptItem | null>(
      (current, item) =>
        current === null ||
        (item.score ?? 0) / item.maxScore >
          (current.score ?? 0) / current.maxScore
          ? item
          : current,
      null,
    );
    return {
      total: items.length,
      completed: completed.length,
      bestLabel: best ? `${best.score} / ${best.maxScore}` : "—",
      bestSkill: best ? skillMeta[best.skill].status : null,
    };
  }, [items]);

  return (
    <section
      aria-label={title ? undefined : "Lịch sử làm bài"}
      aria-labelledby={title ? headingId : undefined}
      className="mt-10 scroll-mt-24"
      data-testid="attempt-history-section"
    >
      {title || showViewAll ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div>
            {title ? (
              <h2 className="text-2xl font-bold text-[#2F2B28]" id={headingId}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-[#6B655F]">{description}</p>
            ) : null}
          </div>
          {showViewAll ? (
            <Link
              className={`text-[15px] font-medium text-[#C2410C] hover:underline ${focusRing}`}
              href="/history"
            >
              Xem tất cả lịch sử →
            </Link>
          ) : null}
        </div>
      ) : null}

      {showSummary && !loading && items.length > 0 ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Tổng lượt làm", String(summary.total)],
            ["Đã hoàn thành", String(summary.completed)],
            [
              "Điểm cao nhất",
              summary.bestSkill
                ? `${summary.bestLabel} · ${summary.bestSkill}`
                : summary.bestLabel,
            ],
          ].map(([label, value]) => (
            <div
              className="rounded-xl border border-[#EEE9E6] bg-white px-4 py-3"
              key={label}
            >
              <dt className="text-xs text-[#6B655F]">{label}</dt>
              <dd className="mt-1 text-lg font-semibold text-[#2F2B28]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {showFilter ? (
        <fieldset
          aria-label="Lọc lịch sử theo kỹ năng"
          className="mt-4 flex flex-wrap gap-2 border-0 p-0"
        >
          {filters
            .filter(
              (option) =>
                option.value === "ALL" ||
                requestedSkills.includes(option.value),
            )
            .map((option) => (
              <button
                aria-pressed={filter === option.value}
                className={`min-h-9 rounded-lg border px-3.5 text-[13px] font-semibold transition ${focusRing} ${
                  filter === option.value
                    ? "border-[#EA580C] bg-[#FFF7ED] text-[#C2410C]"
                    : "border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#FAF7F5]"
                }`}
                key={option.value}
                onClick={() => setFilter(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
        </fieldset>
      ) : null}

      {loading ? (
        <p className="mt-5 rounded-2xl border border-[#EEE9E6] bg-white p-6 text-sm text-[#6B655F]">
          Đang tải lịch sử làm bài…
        </p>
      ) : error ? (
        <p
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : isGuest ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#D8D2CC] bg-white p-6 text-center">
          <p className="text-[15px] font-semibold text-[#2F2B28]">
            Đăng nhập để xem lịch sử làm bài
          </p>
          <p className="mt-1 text-sm text-[#6B655F]">
            Kết quả các lần thi được lưu theo tài khoản của bạn.
          </p>
          <Link
            className={`mt-4 inline-flex min-h-10 items-center rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 text-sm font-semibold text-white ${focusRing}`}
            href="/login?next=%2Fhistory"
          >
            Đăng nhập
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#D8D2CC] bg-white p-6 text-center">
          <p className="text-[15px] font-semibold text-[#2F2B28]">
            Chưa có lượt làm bài nào
          </p>
          <p className="mt-1 text-sm text-[#6B655F]">
            Bài làm đã nộp sẽ xuất hiện ở đây để bạn xem lại.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <AttemptCard item={item} key={`${item.skill}-${item.id}`} />
          ))}
        </div>
      )}

      {!loading && !error && remaining > 0 ? (
        <div className="mt-4 flex justify-center">
          <button
            className={`min-h-10 rounded-lg border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#3D3935] hover:bg-[#FAF7F5] ${focusRing}`}
            onClick={() =>
              setVisibleCount((count) => count + (limit ?? remaining))
            }
            type="button"
          >
            Xem thêm ({remaining})
          </button>
        </div>
      ) : null}
    </section>
  );
}
