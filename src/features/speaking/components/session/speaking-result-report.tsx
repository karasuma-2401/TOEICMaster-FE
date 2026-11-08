"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getSpeakingAttempts,
  type SpeakingAttemptSummary,
} from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import type {
  SpeakingEvaluation,
  SpeakingEvaluationItem,
} from "@/features/speaking/evaluation";
import { formatDate, formatElapsed } from "../ui/format";
import { AlertCircleIcon, AwardIcon, CheckIcon } from "../ui/icons";
import { SpPage } from "../ui/page";
import { Breadcrumb, Chip, type ChipTone } from "../ui/primitives";

type ScoreKey = keyof Pick<
  SpeakingEvaluationItem,
  | "pronunciationScore"
  | "prosodyScore"
  | "grammarScore"
  | "vocabularyScore"
  | "relevanceScore"
>;

const criteria: { key: ScoreKey; vi: string; en: string }[] = [
  { key: "pronunciationScore", vi: "Phát âm", en: "Pronunciation" },
  { key: "prosodyScore", vi: "Ngữ điệu & Trọng âm", en: "Intonation & Stress" },
  { key: "grammarScore", vi: "Ngữ pháp", en: "Grammar" },
  { key: "vocabularyScore", vi: "Từ vựng", en: "Vocabulary" },
  {
    key: "relevanceScore",
    vi: "Tính liên kết & Phù hợp",
    en: "Cohesion & Relevance",
  },
];

function level(score: number): { label: string; tone: ChipTone } {
  if (score >= 80) return { label: "Tốt", tone: "success" };
  if (score >= 60) return { label: "Khá", tone: "warning" };
  return { label: "Cần cải thiện", tone: "danger" };
}

/** Mean of a score over the answers the service could assess. */
function average(items: SpeakingEvaluationItem[], key: ScoreKey) {
  const values = items
    .filter((item) => item.recognitionStatus === "RECOGNIZED")
    .map((item) => item[key])
    .filter((value): value is number => value !== null);
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

export function SpeakingResultReport({
  attempt,
  evaluation,
}: {
  attempt: SpeakingAttempt;
  evaluation: SpeakingEvaluation;
}) {
  const [history, setHistory] = useState<SpeakingAttemptSummary[]>([]);
  useEffect(() => {
    if (!attempt.testId) return;
    const controller = new AbortController();
    getSpeakingAttempts(controller.signal)
      .then((items) =>
        setHistory(
          items
            .filter(
              (item) =>
                item.testId === attempt.testId && item.estimatedScore !== null,
            )
            .toSorted((a, b) => a.createdAtUtc.localeCompare(b.createdAtUtc)),
        ),
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [attempt.testId]);

  const rows = criteria.flatMap((criterion) => {
    const score = average(evaluation.items, criterion.key);
    return score === null ? [] : [{ ...criterion, score }];
  });
  const recent = history.slice(-2);
  const change =
    recent.length === 2
      ? (recent[1].estimatedScore ?? 0) - (recent[0].estimatedScore ?? 0)
      : null;
  const score = evaluation.estimatedScore ?? 0;
  const recorded = attempt.questions.filter((item) => item.recording).length;

  return (
    <SpPage narrow>
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Đề thi thử", href: "/speaking" },
          { label: "Speaking", href: "/speaking" },
          { label: "Kết quả lần thi" },
        ]}
      />
      <section className="relative mt-4 rounded-[20px] border border-(--sp-hero-line) bg-(--sp-cream) p-7">
        <AwardIcon
          className="absolute right-7 top-7 text-(--sp-brand)"
          size={32}
        />
        <Chip className="uppercase" tone="speak">
          SPEAKING · PERSONAL SCORE REPORT
        </Chip>
        <h1 className="mt-2 text-2xl font-semibold">
          Kết quả bài thi Speaking
        </h1>
        <p className="text-[13px] text-(--sp-ink-2)">
          {attempt.testTitle} · {formatDate(attempt.createdAtUtc)} ·{" "}
          {formatElapsed(attempt.createdAtUtc, attempt.submittedAtUtc)} · Trạng
          thái: COMPLETED
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-[1fr_1fr_2fr]">
          <div>
            <p className="text-[40px] font-bold leading-none text-(--sp-brand)">
              {score} / 200
            </p>
            <p className="mt-1 text-xs text-(--sp-ink-2)">
              Điểm TOEIC Speaking ước tính bởi AI · Bước 10 điểm
            </p>
          </div>
          <div>
            <p className="text-xl font-semibold">
              {recorded} / {attempt.questions.length} câu
            </p>
            <p className="mt-1 text-xs text-(--sp-ink-2)">Đã hoàn thành</p>
          </div>
          <div>
            <p className="font-semibold">Bài thi Speaking độc lập</p>
            <p className="mt-1 text-xs text-(--sp-ink-2)">
              Điểm tham khảo theo tiêu chí ETS, không thay thế kết quả thi chính
              thức.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[2.3fr_1fr]">
        <section className="sp-card min-w-0 overflow-x-auto p-6">
          <h2 className="text-lg font-semibold">
            Đánh giá 5 tiêu chí chuẩn ETS
          </h2>
          <table className="mt-3 w-full min-w-[480px] text-left">
            <thead>
              <tr className="sp-overline text-(--sp-ink-3)">
                <th className="py-2 font-semibold">TIÊU CHÍ</th>
                <th className="py-2 font-semibold">MỨC ĐÁNH GIÁ</th>
                <th className="py-2 font-semibold">ĐIỂM TRUNG BÌNH</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const look = level(row.score);
                return (
                  <tr className="border-t border-(--sp-line)" key={row.key}>
                    <td className="py-3">
                      <p className="font-semibold">{row.vi}</p>
                      <p className="text-xs text-(--sp-ink-2)">{row.en}</p>
                    </td>
                    <td>
                      <Chip tone={look.tone}>{look.label}</Chip>
                    </td>
                    <td className="text-[13px]">{Math.round(row.score)}/100</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <aside className="min-w-0 space-y-4">
          {evaluation.summary && (
            <section className="rounded-2xl border border-(--sp-hero-line) bg-(--sp-cream) p-5">
              <h2 className="font-semibold">Bước tiếp theo của bạn</h2>
              <p className="mt-2 text-[13px] text-(--sp-ink-2)">
                {evaluation.summary}
              </p>
            </section>
          )}
          {recent.length > 0 && (
            <section className="sp-card p-5">
              <h2 className="font-semibold">Lịch sử Speaking riêng</h2>
              <p className="mt-2 text-[13px] text-(--sp-ink-2)">
                {recent
                  .map(
                    (item) =>
                      `${formatDate(item.createdAtUtc).slice(0, 5)}: ${item.estimatedScore}/200`,
                  )
                  .join(" → ")}
              </p>
              {change !== null && (
                <Chip
                  className="mt-2"
                  tone={change >= 0 ? "success" : "warning"}
                >
                  {change >= 0 ? `+${change}` : change} điểm so với lần trước
                </Chip>
              )}
            </section>
          )}
        </aside>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-(--sp-success-border-soft) bg-(--sp-success-bg) p-5">
          <h2 className="font-semibold">Điểm mạnh nổi bật</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {(evaluation.strengths.length
              ? evaluation.strengths
              : ["Chưa có nhận xét."]
            ).map((item) => (
              <li className="flex gap-2" key={item}>
                <CheckIcon
                  className="mt-0.5 shrink-0 text-(--sp-success)"
                  size={16}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-(--sp-warning-line) bg-(--sp-warning-bg) p-5">
          <h2 className="font-semibold">Cần ưu tiên cải thiện</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {(evaluation.improvements.length
              ? evaluation.improvements
              : ["Chưa có nhận xét."]
            ).map((item) => (
              <li className="flex gap-2" key={item}>
                <AlertCircleIcon
                  className="mt-0.5 shrink-0 text-(--sp-brand)"
                  size={16}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          className="sp-btn sp-btn-cta"
          href={`/speaking/attempts/${encodeURIComponent(attempt.id)}/review/1`}
        >
          Xem lại & Nghe lại chi tiết bài làm
        </Link>
        <Link className="sp-btn sp-btn-outline" href="/speaking">
          Về danh sách đề Speaking
        </Link>
      </div>
    </SpPage>
  );
}
