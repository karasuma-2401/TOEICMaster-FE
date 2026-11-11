"use client";

import { useEffect, useState } from "react";
import {
  getSpeakingAttempts,
  type SpeakingAttemptSummary,
} from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";

/**
 * Earlier and current attempts of the same test mode or exercise, oldest first.
 * Attempts with no recording are left out: opening a practice page creates one
 * just to read the content, and those are not real tries.
 */
export function useAttemptHistory(attempt: SpeakingAttempt | null) {
  const [items, setItems] = useState<SpeakingAttemptSummary[]>([]);
  const id = attempt?.id;
  const testId = attempt?.testId ?? null;
  const exerciseId = attempt?.exerciseId ?? null;
  const mode = attempt?.mode ?? null;

  useEffect(() => {
    if (!testId && !exerciseId) return;
    const controller = new AbortController();
    getSpeakingAttempts(controller.signal)
      .then((all) =>
        setItems(
          all
            .filter(
              (item) =>
                (testId
                  ? item.testId === testId
                  : item.exerciseId === exerciseId) &&
                (item.mode === null || item.mode === mode) &&
                item.recordedCount !== 0,
            )
            .toSorted((a, b) => a.createdAtUtc.localeCompare(b.createdAtUtc)),
        ),
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [exerciseId, mode, testId]);

  const index = items.findIndex((item) => item.id === id);
  return { items, number: index >= 0 ? index + 1 : null };
}
