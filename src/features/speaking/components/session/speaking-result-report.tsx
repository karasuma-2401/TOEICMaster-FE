"use client";

import Link from "next/link";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import type {
  SpeakingEvaluation,
  SpeakingEvaluationItem,
} from "@/features/speaking/evaluation";
import { useAttemptHistory } from "@/features/speaking/hooks/use-attempt-history";
import { formatAttemptNumber, formatDate, formatElapsed } from "../ui/format";
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

type Band = "good" | "fair" | "low";

// `speech` marks the criteria Azure Speech measures, shown with an English level.
const criteria: {
  key: ScoreKey;
  vi: string;
  en: string;
  speech?: boolean;
  /** One line per score band; the backend returns scores, not per-criterion notes. */
  notes: Record<Band, string>;
}[] = [
  {
    key: "pronunciationScore",
    vi: "Phát âm",
    en: "Pronunciation",
    speech: true,
    notes: {
      good: "Phát âm rõ ở phần lớn các từ.",
      fair: "Một số từ chưa rõ, xem chi tiết từng câu.",
      low: "Nhiều từ chưa rõ, nên luyện lại từng âm.",
    },
  },
  {
    key: "prosodyScore",
    vi: "Ngữ điệu & Trọng âm",
    en: "Intonation & Stress",
    speech: true,
    notes: {
      good: "Ngữ điệu và trọng âm tự nhiên.",
      fair: "Cần chú ý ngữ điệu và trọng âm ở một số câu.",
      low: "Ngữ điệu còn đều, nên nghe mẫu và nhại lại.",
    },
  },
  {
    key: "grammarScore",
    vi: "Ngữ pháp",
    en: "Grammar",
    notes: {
      good: "Cấu trúc câu chính xác.",
      fair: "Còn một số lỗi ngữ pháp.",
      low: "Cần ôn lại cấu trúc câu cơ bản.",
    },
  },
  {
    key: "vocabularyScore",
    vi: "Từ vựng",
    en: "Vocabulary",
    notes: {
      good: "Dùng từ đa dạng, phù hợp.",
      fair: "Từ vựng đủ ý, có thể đa dạng hơn.",
      low: "Vốn từ còn hạn chế, cần mở rộng.",
    },
  },
  {
    key: "relevanceScore",
    vi: "Tính liên kết & Phù hợp",
    en: "Cohesion & Relevance",
    notes: {
      good: "Trả lời đúng trọng tâm, mạch lạc.",
      fair: "Có chỗ chưa bám sát câu hỏi.",
      low: "Câu trả lời chưa đúng trọng tâm.",
    },
  },
];

const bandLook: Record<
  Band,
  { label: string; english: string; tone: ChipTone }
> = {
  good: { label: "Tốt", english: "High", tone: "success" },
  fair: { label: "Khá", english: "Medium", tone: "warning" },
  low: { label: "Cần cải thiện", english: "Low", tone: "danger" },
};

const bandOf = (score: number): Band =>
  score >= 80 ? "good" : score >= 60 ? "fair" : "low";

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

/** The Part with the lowest share of its raw points. */
function weakestPart(items: SpeakingEvaluationItem[]) {
  const totals = new Map<number, { raw: number; max: number }>();
  for (const item of items) {
    const total = totals.get(item.part) ?? { raw: 0, max: 0 };
    total.raw += item.rawScore;
    total.max += item.maxRawScore;
    totals.set(item.part, total);
  }
  return [...totals.entries()]
    .filter(([, total]) => total.max > 0)
    .toSorted(([, a], [, b]) => a.raw / a.max - b.raw / b.max)[0]?.[0];
}

const joinNames = (names: string[]) =>
  names.length > 1
    ? `${names.slice(0, -1).join(", ")} và ${names.at(-1)}`
    : (names[0] ?? "");

export function SpeakingResultReport({
  attempt,
  evaluation,
}: {
  attempt: SpeakingAttempt;
  evaluation: SpeakingEvaluation;
}) {
  const { items: attempts, number } = useAttemptHistory(attempt);
  const history = attempts.filter((item) => item.estimatedScore !== null);

  const rows = criteria.flatMap((criterion) => {
    const value = average(evaluation.items, criterion.key);
    return value === null ? [] : [{ ...criterion, score: value }];
  });
  const strong = rows.filter((row) => bandOf(row.score) === "good");
  const weak = rows.filter((row) => bandOf(row.score) !== "good");
  const lowest = rows.toSorted((a, b) => a.score - b.score)[0];
  const part = weakestPart(evaluation.items);
  const recent = history.slice(-2);
  const change =
    recent.length === 2
      ? (recent[1].estimatedScore ?? 0) - (recent[0].estimatedScore ?? 0)
      : null;
  const score = evaluation.estimatedScore ?? 0;
  const recorded = attempt.questions.filter((item) => item.recording).length;
  const partCount = new Set(attempt.questions.map((item) => item.part)).size;
  const attemptLabel =
    number === null ? null : `Lần thi ${formatAttemptNumber(number)}`;

  return (
    <SpPage narrow>
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Đề thi thử", href: "/speaking" },
          { label: "Speaking", href: "/speaking" },
          {
            label: attemptLabel
              ? `Kết quả ${attemptLabel.toLowerCase()}`
              : "Kết quả lần thi",
          },
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
          {attemptLabel && `${attemptLabel} · `}
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
            <p className="mt-1 text-xs text-(--sp-ink-2)">
              Đã hoàn thành ·{" "}
              {partCount > 1
                ? `${partCount} Parts`
                : `Part ${attempt.questions[0]?.part}`}
            </p>
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
                <th className="py-2 font-semibold">NHẬN XÉT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const band = bandOf(row.score);
                const look = bandLook[band];
                return (
                  <tr className="border-t border-(--sp-line)" key={row.key}>
                    <td className="py-3">
                      <p className="font-semibold">{row.vi}</p>
                      <p className="text-xs text-(--sp-ink-2)">{row.en}</p>
                    </td>
                    <td>
                      <Chip tone={look.tone}>
                        {row.speech
                          ? `${look.label} (${look.english})`
                          : look.label}
                      </Chip>
                    </td>
                    <td className="text-[13px]">
                      <span className="font-semibold">
                        {Math.round(row.score)}/100
                      </span>{" "}
                      <span className="text-(--sp-ink-2)">
                        · {row.notes[band]}
                      </span>
                    </td>
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
              {lowest && (
                <p className="mt-2 text-xs text-(--sp-ink-2)">
                  Ưu tiên: {lowest.en}
                  {part !== undefined && ` · Part ${part}`}
                </p>
              )}
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

      <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-(--sp-success-border-soft) bg-(--sp-success-bg) p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Điểm mạnh nổi bật</h2>
            {strong.length > 0 && (
              <p className="text-xs text-(--sp-success)">
                {strong.length} tiêu chí tốt
              </p>
            )}
          </div>
          {strong.length > 0 && (
            <p className="mt-2 text-[13px]">
              {joinNames(strong.map((row) => row.vi))} đang là những điểm mạnh
              nổi bật trong bài Speaking lần này.
            </p>
          )}
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
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Cần ưu tiên cải thiện</h2>
            {weak.length > 0 && (
              <p className="text-xs text-(--sp-warning)">
                {weak.length} tiêu chí cần cải thiện
              </p>
            )}
          </div>
          {weak.length > 0 && (
            <p className="mt-2 text-[13px]">
              {joinNames(weak.map((row) => row.vi))} cần được ưu tiên cải thiện
              để nâng cao điểm Speaking.
            </p>
          )}
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
