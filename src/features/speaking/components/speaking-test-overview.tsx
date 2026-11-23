"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getSpeakingTest,
  type SpeakingTestSummary,
} from "@/features/speaking/api";
import {
  partTimingLabel,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
import {
  modeFromRoute,
  modeParts,
  routeFromMode,
} from "@/features/speaking/practice";
import { RuleList, StructureList } from "@/shared/components/practice/briefing";
import { BackLink } from "@/shared/components/practice/page-intro";
import { PracticeColumns } from "@/shared/components/practice/practice-page";
import { StatGrid } from "@/shared/components/practice/stat-grid";
import {
  ErrorPanel,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  eyebrow,
  primaryAction,
  surfaceCard,
} from "@/shared/components/practice/styles";
import { formatMinutes } from "@/shared/ui/format-time";
import { SpPage } from "./ui/page";

export function SpeakingTestOverview({
  testId,
  mode,
}: {
  testId: string;
  mode?: string;
}) {
  const [test, setTest] = useState<SpeakingTestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedMode = modeFromRoute(mode);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        setTest(await getSpeakingTest(testId, signal));
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the Speaking test.",
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

  if (!test && !error)
    return (
      <SpPage>
        <LoadingPanel label="Loading Speaking test..." />
      </SpPage>
    );
  if (!test)
    return (
      <SpPage>
        <BackLink href="/speaking" label="Back to library" />
        <ErrorPanel
          message={error}
          onRetry={() => void load()}
          retryLabel="Retry"
        />
      </SpPage>
    );

  const parts = modeParts(selectedMode);
  const visibleParts = test.parts.filter((part) => parts.includes(part.part));
  const questionCount = visibleParts.reduce(
    (total, part) => total + part.questionCount,
    0,
  );
  const totalSeconds = visibleParts.reduce(
    (total, part) => total + part.durationSeconds,
    0,
  );
  return (
    <SpPage>
      <BackLink href="/speaking" label="Back to Speaking library" />
      <div className="mt-6">
        <PracticeColumns
          aside={
            <div className={`space-y-5 p-5 ${surfaceCard}`}>
              <RuleList
                id="speaking-rules"
                rules={[
                  "Your browser will request microphone permission before starting.",
                  "Each question has a preparation phase, then automatically records during the response phase.",
                  "When time expires, the current question is locked and advances to the next one.",
                  "Each question's recording is uploaded to the server for playback; AI grading only starts when you consent.",
                ]}
              />
              <Link
                className={`w-full ${primaryAction}`}
                href={`/speaking/tests/${encodeURIComponent(test.id)}/practice?mode=${routeFromMode(selectedMode)}`}
              >
                Start Test
              </Link>
            </div>
          }
          main={
            <div className={`overflow-hidden ${surfaceCard}`}>
              <div className="border-b border-slate-100 bg-gradient-to-br from-orange-50/80 via-white to-white p-6 sm:p-9">
                <p className={eyebrow}>
                  {selectedMode === "FULL"
                    ? "FULL SPEAKING TEST"
                    : "PART PRACTICE"}
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                  {test.title}
                </h1>
                <p className="mt-3 max-w-prose leading-7 text-slate-600">
                  {test.description}
                </p>
                <div className="mt-7">
                  <StatGrid
                    className="sm:grid-cols-3"
                    items={[
                      {
                        label: "Structure",
                        value: `${questionCount} questions`,
                      },
                      {
                        label: "Duration",
                        value: formatMinutes(totalSeconds),
                      },
                      { label: "Format", value: "Microphone recording" },
                    ]}
                  />
                </div>
              </div>
              <div className="p-6 sm:p-9">
                <StructureList
                  id="speaking-structure"
                  items={visibleParts.map((part) => ({
                    key: part.part,
                    badge: part.part,
                    title: `Speaking Part ${part.part} · ${speakingPartSpecs[part.part].subtitle}`,
                    detail: `${part.questionCount} questions · ${partTimingLabel(part.part)}`,
                  }))}
                />
              </div>
            </div>
          }
        />
      </div>
    </SpPage>
  );
}
