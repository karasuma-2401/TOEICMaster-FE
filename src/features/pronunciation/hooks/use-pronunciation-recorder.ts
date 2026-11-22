"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus =
  "idle" | "requesting" | "recording" | "denied" | "unsupported" | "mic-lost";

export interface Take {
  blob: Blob;
  url: string;
  durationMs: number;
  /** Loudest input level seen while recording, 0–1. */
  peakLevel: number;
}

export const maxTakeMs = 5000;

function isSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/**
 * Records one short take at a time. A new take replaces the previous one and
 * revokes its object URL. The microphone stays open while the page is mounted
 * so retakes start instantly; `release()` closes it.
 */
export function usePronunciationRecorder({
  maxMs = maxTakeMs,
  onTake,
}: {
  maxMs?: number;
  onTake?: (take: Take) => void;
} = {}) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [level, setLevel] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [take, setTake] = useState<Take | null>(null);

  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const frame = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peak = useRef(0);
  const discardNext = useRef(false);
  const currentUrl = useRef<string | null>(null);
  const onTakeRef = useRef(onTake);

  useEffect(() => {
    onTakeRef.current = onTake;
  }, [onTake]);

  const clearTimers = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (timer.current !== null) clearInterval(timer.current);
    if (autoStop.current !== null) clearTimeout(autoStop.current);
    frame.current = null;
    timer.current = null;
    autoStop.current = null;
    setLevel(0);
  }, []);

  const closeStream = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    analyser.current = null;
    void audioContext.current?.close().catch(() => undefined);
    audioContext.current = null;
  }, []);

  const replaceUrl = useCallback((url: string | null) => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = url;
  }, []);

  const openStream = useCallback(async () => {
    if (stream.current) return true;
    setStatus("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      try {
        const context = new AudioContext();
        const node = context.createAnalyser();
        node.fftSize = 256;
        context.createMediaStreamSource(media).connect(node);
        audioContext.current = context;
        analyser.current = node;
      } catch {
        // No meter available; recording still works.
        analyser.current = null;
      }
      media.getAudioTracks()[0]?.addEventListener("ended", () => {
        discardNext.current = true;
        if (recorder.current?.state === "recording") recorder.current.stop();
        recorder.current = null;
        clearTimers();
        closeStream();
        setStatus("mic-lost");
      });
      return true;
    } catch {
      setStatus("denied");
      return false;
    }
  }, [clearTimers, closeStream]);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    recorder.current = null;
    clearTimers();
  }, [clearTimers]);

  const start = useCallback(async () => {
    if (recorder.current) return;
    if (!isSupported()) {
      setStatus("unsupported");
      return;
    }
    if (!(await openStream()) || !stream.current) return;

    const chunks: Blob[] = [];
    const startedAt = Date.now();
    const next = new MediaRecorder(stream.current);
    peak.current = 0;
    discardNext.current = false;

    next.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    next.onstop = () => {
      if (discardNext.current) {
        discardNext.current = false;
        return;
      }
      const blob = new Blob(chunks, { type: next.mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);
      replaceUrl(url);
      const result: Take = {
        blob,
        url,
        durationMs: Date.now() - startedAt,
        peakLevel: analyser.current ? peak.current : 1,
      };
      setTake(result);
      setStatus("idle");
      onTakeRef.current?.(result);
    };

    next.start();
    recorder.current = next;
    setStatus("recording");
    setElapsedMs(0);

    const node = analyser.current;
    if (node) {
      const samples = new Uint8Array(node.frequencyBinCount);
      const read = () => {
        node.getByteTimeDomainData(samples);
        let max = 0;
        for (const sample of samples)
          max = Math.max(max, Math.abs(sample - 128));
        const value = Math.min(1, max / 64);
        peak.current = Math.max(peak.current, value);
        setLevel(value);
        frame.current = requestAnimationFrame(read);
      };
      read();
    }
    timer.current = setInterval(
      () => setElapsedMs(Math.min(maxMs, Date.now() - startedAt)),
      100,
    );
    autoStop.current = setTimeout(stop, maxMs);
  }, [maxMs, openStream, replaceUrl, stop]);

  /** Drops the current take (and any take being recorded). */
  const discard = useCallback(() => {
    if (recorder.current) {
      discardNext.current = true;
      stop();
    }
    replaceUrl(null);
    setTake(null);
    setElapsedMs(0);
    setStatus((current) => (current === "recording" ? "idle" : current));
  }, [replaceUrl, stop]);

  /** Discards everything and closes the microphone. */
  const release = useCallback(() => {
    discard();
    closeStream();
    setStatus((current) =>
      current === "denied" || current === "unsupported" ? current : "idle",
    );
  }, [closeStream, discard]);

  useEffect(
    () => () => {
      discardNext.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      recorder.current = null;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (timer.current !== null) clearInterval(timer.current);
      if (autoStop.current !== null) clearTimeout(autoStop.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      void audioContext.current?.close().catch(() => undefined);
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    },
    [],
  );

  return {
    status,
    level,
    elapsedMs,
    take,
    maxMs,
    start,
    stop,
    discard,
    release,
  };
}
