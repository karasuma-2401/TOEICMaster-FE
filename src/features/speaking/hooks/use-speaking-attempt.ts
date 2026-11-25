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
  /**
   * One AbortController per mounted `attemptId`. It is aborted on unmount or
   * when the hook switches to another attempt, which cancels the in-flight
   * GET and drops any late response so it cannot overwrite the new attempt.
   */
  const lifecycle = useRef<AbortController | null>(null);
  /** The lifecycle whose refresh is currently in flight (single-flight per attempt). */
  const inFlight = useRef<AbortController | null>(null);

  const accept = useCallback((value: SpeakingAttempt) => {
    setServerOffset(Date.parse(value.serverNowUtc) - Date.now());
    setNow(Date.now());
    setAttempt(value);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    const life = lifecycle.current;
    if (!life || life.signal.aborted || inFlight.current === life) return;
    inFlight.current = life;
    try {
      const value = await getSpeakingAttempt(attemptId, life.signal);
      if (!life.signal.aborted) accept(value);
    } catch (cause) {
      if (life.signal.aborted) return;
      setError(
        cause instanceof Error ? cause.message : "Could not load the attempt.",
      );
    } finally {
      if (inFlight.current === life) inFlight.current = null;
    }
  }, [accept, attemptId]);

  useEffect(() => {
    const life = new AbortController();
    lifecycle.current = life;
    const task = window.setTimeout(() => void refresh(), 0);
    return () => {
      window.clearTimeout(task);
      life.abort();
      if (lifecycle.current === life) lifecycle.current = null;
    };
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
    const life = lifecycle.current;
    setBusy(true);
    try {
      const value = await nextSpeakingPhase(attemptId);
      if (life?.signal.aborted) return;
      accept(value);
    } catch (cause) {
      if (life?.signal.aborted) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not advance to the next step.",
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
