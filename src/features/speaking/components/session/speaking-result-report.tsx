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

// `speech` marks the criteria Azure Speech measures.
const criteria: {
  key: ScoreKey;
  label: string;
  speech?: boolean;
  /** One line per score band; the backend returns scores, not per-criterion notes. */
  notes: Record<Band, string>;
}[] = [
  {
    key: "pronunciationScore",
    label: "Pronunciation",
    speech: true,
    notes: {
      good: "Clear pronunciation on most words.",
      fair: "Some words were unclear; see question details.",
      low: "Many words were unclear; practice individual sounds.",
    },
  },
  {
    key: "prosodyScore",
    label: "Intonation & Stress",
    speech: true,
    notes: {
      good: "Natural intonation and stress.",
      fair: "Pay attention to intonation and stress in some sentences.",
      low: "Intonation sounds flat; listen to sample audio and shadow.",
    },
  },
  {
    key: "grammarScore",
    label: "Grammar",
    notes: {
      good: "Accurate sentence structures.",
      fair: "A few grammar errors remain.",
      low: "Review basic sentence structures.",
    },
  },
  {
    key: "vocabularyScore",
    label: "Vocabulary",
    notes: {
      good: "Varied and appropriate word choice.",
      fair: "Adequate vocabulary; could be more varied.",
      low: "Limited vocabulary; work on expanding word choice.",
    },
  },
  {
    key: "relevanceScore",
    label: "Cohesion & Relevance",
    notes: {
      good: "On-topic and coherent responses.",
      fair: "Some parts did not directly address the prompt.",
      low: "Responses were off-topic.",
    },
  },
];

const bandLook: Record<Band, { label: string; tone: ChipTone }> = {
  good: { label: "High", tone: "success" },
  fair: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "danger" },
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
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
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
    number === null ? null : `Attempt ${formatAttemptNumber(number)}`;

  return (
    <SpPage narrow>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Practice Tests", href: "/speaking" },
          { label: "Speaking", href: "/speaking" },
          {
            label: attemptLabel ? `${attemptLabel} results` : "Attempt results",
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
        <h1 className="mt-2 text-2xl font-semibold">Speaking Test Results</h1>
        <p className="text-[13px] text-(--sp-ink-2)">
          {attempt.testTitle} · {formatDate(attempt.createdAtUtc)} ·{" "}
          {attemptLabel && `${attemptLabel} · `}
          {formatElapsed(attempt.createdAtUtc, attempt.submittedAtUtc)} ·
          Status: COMPLETED
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-[1fr_1fr_2fr]">
          <div>
            <p className="text-[40px] font-bold leading-none text-(--sp-brand)">
              {score} / 200
            </p>
            <p className="mt-1 text-xs text-(--sp-ink-2)">
              AI-estimated TOEIC Speaking score · 10-point increments
            </p>
          </div>
          <div>
            <p className="text-xl font-semibold">
              {recorded} / {attempt.questions.length} questions
            </p>
            <p className="mt-1 text-xs text-(--sp-ink-2)">
              Completed ·{" "}
              {partCount > 1
                ? `${partCount} Parts`
                : `Part ${attempt.questions[0]?.part}`}
            </p>
          </div>
          <div>
            <p className="font-semibold">Standalone Speaking Test</p>
            <p className="mt-1 text-xs text-(--sp-ink-2)">
              Reference score based on ETS criteria; does not replace official
              test results.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[2.3fr_1fr]">
        <section className="sp-card min-w-0 overflow-x-auto p-6">
          <h2 className="text-lg font-semibold">
            Evaluation across 5 ETS criteria
          </h2>
          <table className="mt-3 w-full min-w-[480px] text-left">
            <thead>
              <tr className="sp-overline text-(--sp-ink-3)">
                <th className="py-2 font-semibold">CRITERION</th>
                <th className="py-2 font-semibold">LEVEL</th>
                <th className="py-2 font-semibold">FEEDBACK</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const band = bandOf(row.score);
                const look = bandLook[band];
                return (
                  <tr className="border-t border-(--sp-line)" key={row.key}>
                    <td className="py-3">
                      <p className="font-semibold">{row.label}</p>
                    </td>
                    <td>
                      <Chip tone={look.tone}>{look.label}</Chip>
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
              <h2 className="font-semibold">Your next steps</h2>
              <p className="mt-2 text-[13px] text-(--sp-ink-2)">
                {evaluation.summary}
              </p>
              {lowest && (
                <p className="mt-2 text-xs text-(--sp-ink-2)">
                  Priority: {lowest.label}
                  {part !== undefined && ` · Part ${part}`}
                </p>
              )}
            </section>
          )}
          {recent.length > 0 && (
            <section className="sp-card p-5">
              <h2 className="font-semibold">Your Speaking history</h2>
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
                  {change >= 0 ? `+${change}` : change} pts vs. previous
                </Chip>
              )}
            </section>
          )}
        </aside>
      </div>

      <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-(--sp-success-border-soft) bg-(--sp-success-bg) p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Key strengths</h2>
            {strong.length > 0 && (
              <p className="text-xs text-(--sp-success)">
                {strong.length} strong criteria
              </p>
            )}
          </div>
          {strong.length > 0 && (
            <p className="mt-2 text-[13px]">
              {joinNames(strong.map((row) => row.label))} are your standout
              strengths in this Speaking attempt.
            </p>
          )}
          <ul className="mt-3 space-y-2 text-[13px]">
            {(evaluation.strengths.length
              ? evaluation.strengths
              : ["No feedback yet."]
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
            <h2 className="text-lg font-semibold">Areas to prioritize</h2>
            {weak.length > 0 && (
              <p className="text-xs text-(--sp-warning)">
                {weak.length} criteria to improve
              </p>
            )}
          </div>
          {weak.length > 0 && (
            <p className="mt-2 text-[13px]">
              {joinNames(weak.map((row) => row.label))} should be prioritized to
              raise your Speaking score.
            </p>
          )}
          <ul className="mt-3 space-y-2 text-[13px]">
            {(evaluation.improvements.length
              ? evaluation.improvements
              : ["No feedback yet."]
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
          Review & listen back to details
        </Link>
        <Link className="sp-btn sp-btn-outline" href="/history">
          Go to attempt history
        </Link>
        <Link className="sp-btn sp-btn-outline" href="/speaking">
          Back to Speaking tests
        </Link>
      </div>
    </SpPage>
  );
}
