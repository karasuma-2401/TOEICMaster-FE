"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getWritingTest,
  modeFromRoute,
  startWritingAttempt,
  type WritingTestSummaryApi,
} from "@/features/writing/attempt-api";
import { Breadcrumbs } from "@/shared/components/practice/breadcrumbs";
import { BackLink } from "@/shared/components/practice/page-intro";
import { PracticePage } from "@/shared/components/practice/practice-page";
import {
  ErrorPanel,
  InlineError,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  focusRing,
  primaryAction,
  secondaryAction,
  surfaceCard,
} from "@/shared/components/practice/styles";
import { WritingHeader } from "./writing-header";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return seconds % 60 ? `${minutes} min ${seconds % 60} sec` : `${minutes} min`;
}

function shortDuration(seconds: number) {
  return seconds <= 60 ? `${seconds}s` : formatDuration(seconds);
}

const partGuides = {
  1: {
    title: "Write sentences based on pictures",
    detail:
      "Use both keywords to write one sentence accurately describing each picture. Pay attention to structure and grammar.",
  },
  2: {
    title: "Respond to an email",
    detail:
      "Read the directions and write an email addressing all required points. Use a polite tone suited to the context.",
  },
  3: {
    title: "Opinion essay",
    detail:
      "Present your opinion with clear reasons and specific examples. At least 300 words recommended, structured into an introduction, body paragraphs, and conclusion.",
  },
} as const;

const greenTag = "w-fit rounded-lg bg-[#f1fdf5] text-[#2f7d4f]";

export function WritingTestOverview({
  testId,
  mode,
}: {
  testId: string;
  mode?: string;
}) {
  const router = useRouter();
  const [test, setTest] = useState<WritingTestSummaryApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const selectedMode = modeFromRoute(mode);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        setTest(await getWritingTest(testId, signal));
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load the Writing test.",
          );
      }
    },
    [testId],
  );
  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [load]);

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      const attempt = await startWritingAttempt(testId, selectedMode);
      router.push(`/writing/attempts/${encodeURIComponent(attempt.id)}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to start the attempt.",
      );
      setStarting(false);
    }
  };

  if (!test && !error)
    return (
      <PracticePage header={<WritingHeader />}>
        <LoadingPanel label="Loading Writing test..." />
      </PracticePage>
    );
  if (!test)
    return (
      <PracticePage header={<WritingHeader />}>
        <BackLink href="/writing" label="Back to library" />
        <ErrorPanel
          message={error}
          onRetry={() => void load()}
          retryLabel="Retry"
        />
      </PracticePage>
    );

  const selectedPart = test.parts.find(
    (part) => selectedMode === `PART_${part.part}`,
  );
  const visibleParts = selectedPart ? [selectedPart] : test.parts;
  const questionCount = visibleParts.reduce(
    (total, part) => total + part.questionCount,
    0,
  );
  const totalSeconds = visibleParts.reduce(
    (total, part) =>
      total +
      part.questionCount * (part.preparationSeconds + part.responseSeconds),
    0,
  );
  const stats = [
    {
      value: `${questionCount} ${questionCount === 1 ? "question" : "questions"}`,
      label: "sequential · locked after advancing",
    },
    selectedPart
      ? { value: `Part ${selectedPart.part}`, label: "single-part practice" }
      : {
          value: `${test.parts.length} Parts`,
          label: `Part 1-${test.parts.length} · sequential`,
        },
    selectedPart
      ? { value: formatDuration(totalSeconds), label: "total time" }
      : { value: "0-200", label: "estimated score scale" },
    { value: "Auto", label: "save and lock after each question" },
  ];
  const guides = test.parts.flatMap((part, index) => {
    const first =
      test.parts
        .slice(0, index)
        .reduce((total, item) => total + item.questionCount, 0) + 1;
    const last = first + part.questionCount - 1;
    if (selectedPart && part !== selectedPart) return [];
    return [
      {
        part,
        range:
          first === last ? `Question ${first}` : `Questions ${first}-${last}`,
      },
    ];
  });

  return (
    // The bottom space lets the start button scroll clear of the guide mascot.
    <PracticePage className="pb-44 pt-8 lg:pt-10" header={<WritingHeader />}>
      <div className="mx-auto max-w-[1000px]">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: selectedPart ? "Exercises" : "Practice tests" },
            { label: "Writing", href: "/writing" },
            { label: test.title },
          ]}
        />
        <div className={`mt-4 p-6 sm:p-8 ${surfaceCard}`}>
          <p className={`${greenTag} px-2.5 py-1 text-xs`}>
            {selectedPart
              ? "WRITING · PRACTICE BY PART"
              : "WRITING · FULL TEST"}
          </p>
          <h1 className="mt-4 text-[28px] font-semibold leading-9 text-[#3d3935]">
            {test.title}
          </h1>
          {test.description && (
            <p className="mt-2 max-w-prose text-[15px] leading-6 text-[#6b655f]">
              {test.description}
            </p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div className="rounded-2xl bg-[#f7f6f4] p-5" key={stat.label}>
                <dd className="text-2xl font-semibold text-[#3d3935]">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-sm text-[#6b655f]">{stat.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-lg font-semibold leading-7 text-[#3d3935]">
            {selectedPart ? "This practice section" : "This test"} includes{" "}
            {questionCount} sequential{" "}
            {questionCount === 1 ? "question" : "questions"}. Each question has
            its own preparation and response time. Once you move on, the
            previous question is permanently locked.
          </p>
          <div
            className={`mt-5 grid gap-6 ${selectedPart ? "" : "md:grid-cols-3"}`}
          >
            {guides.map(({ part, range }, index) => (
              <section key={part.part}>
                <p className={`${greenTag} px-2.5 py-1 text-xs`}>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-base font-semibold text-[#3d3935]">
                  Part {part.part} · {partGuides[part.part].title}
                </h2>
                <p className="mt-2 text-[13px] text-[#6b655f]">
                  {range} · {shortDuration(part.preparationSeconds)} prep +{" "}
                  {shortDuration(part.responseSeconds)} writing
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4a4541]">
                  {partGuides[part.part].detail}
                </p>
              </section>
            ))}
          </div>
          <div className="mt-6 flex gap-3 rounded-2xl bg-[#fbf3c8] p-5">
            <svg
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-[#c2761e]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <path d="M12 3 5 5.5v6c0 4.5 2.9 7.8 7 9.5 4.1-1.7 7-5 7-9.5v-6L12 3ZM12 8v4M12 15.5h.01" />
            </svg>
            <div>
              <h2 className="font-semibold text-[#3d3935]">
                External paste blocked · Spellcheck disabled
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#4a4541]">
                Type your response directly. No spelling or grammar suggestions
                are available during the test. Your work is saved automatically
                and locked after each question.
              </p>
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-[#e9f3ec] p-4 text-[15px] text-[#3d3935]">
            <input
              checked={ready}
              className={`size-5 shrink-0 accent-[#3f7a52] ${focusRing}`}
              onChange={(event) => setReady(event.target.checked)}
              type="checkbox"
            />
            I have read the rules, am ready to begin, and have a stable internet
            connection.
          </label>
          {error && (
            <div className="mt-4">
              <InlineError>{error}</InlineError>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Link className={secondaryAction} href="/writing">
              ← Back to Writing test list
            </Link>
            <button
              className={primaryAction}
              disabled={!ready || starting}
              onClick={() => void start()}
              type="button"
            >
              {starting ? "Starting attempt..." : "START WRITING TEST"}
            </button>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-[#6b655f]">
          {!selectedPart && (
            <>
              Total duration <span>{formatDuration(totalSeconds)}</span> ·{" "}
            </>
          )}
          Writing has {questionCount} sequential{" "}
          {questionCount === 1 ? "question" : "questions"}, locked after each
          question · Latest Chrome recommended
        </p>
      </div>
    </PracticePage>
  );
}
