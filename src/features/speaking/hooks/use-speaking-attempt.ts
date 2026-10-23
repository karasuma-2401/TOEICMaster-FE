"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeakingAttempt, nextSpeakingPhase } from "@/features/speaking/api";
import {
  phaseSecondsLeft,
  type SpeakingAttempt,
} from "@/features/speaking/attempt";

/**
 * Loads an attempt and counts down to the server's `phaseEndsAtUtc`. When a
 * deadline passes it re-fetches, and the backend advances the phase.
 */
export function useSpeakingAttempt(attemptId: string) {
  const [attempt, setAttempt] = useState<SpeakingAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(0);
  const inFlight = useRef(false);

  const accept = useCallback((value: SpeakingAttempt) => {
    setServerOffset(Date.parse(value.serverNowUtc) - Date.now());
    setNow(Date.now());
    setAttempt(value);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      accept(await getSpeakingAttempt(attemptId));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải lượt làm.",
      );
    } finally {
      inFlight.current = false;
    }
  }, [accept, attemptId]);

  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  const phaseEndsAtUtc = attempt?.phaseEndsAtUtc ?? null;
  useEffect(() => {
    if (!phaseEndsAtUtc) return;
    const timer = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (Date.parse(phaseEndsAtUtc) <= tick + serverOffset) void refresh();
    }, 250);
    return () => window.clearInterval(timer);
  }, [phaseEndsAtUtc, refresh, serverOffset]);

  const skipPhase = useCallback(async () => {
    setBusy(true);
    try {
      accept(await nextSpeakingPhase(attemptId));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể chuyển bước.",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [accept, attemptId, refresh]);

  return {
    attempt,
    error,
    busy,
    seconds: attempt ? phaseSecondsLeft(attempt, now, serverOffset) : 0,
    refresh,
    skipPhase,
    accept,
  };
}
