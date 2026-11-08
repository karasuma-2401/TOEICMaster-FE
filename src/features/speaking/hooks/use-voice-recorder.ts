"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MicrophoneStatus =
  "idle" | "requesting" | "ready" | "denied" | "unsupported";

export interface Recording {
  blob: Blob;
  url: string;
  durationSeconds: number;
}

function isSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/**
 * Records one answer at a time from the microphone and keeps an object URL
 * per key. Callers upload the blob; the URL serves instant local playback.
 */
export function useVoiceRecorder() {
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const [recordingKey, setRecordingKey] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [recordings, setRecordings] = useState<Record<number, Recording>>({});
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const frame = useRef<number | null>(null);
  const urls = useRef<string[]>([]);

  const requestAccess = useCallback(async () => {
    if (!isSupported()) {
      setStatus("unsupported");
      return false;
    }
    if (stream.current) return true;
    setStatus("requesting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const context = new AudioContext();
      const node = context.createAnalyser();
      node.fftSize = 256;
      context.createMediaStreamSource(stream.current).connect(node);
      audioContext.current = context;
      analyser.current = node;
      setStatus("ready");
      return true;
    } catch {
      setStatus("denied");
      return false;
    }
  }, []);

  const stopMeter = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setLevel(0);
  }, []);

  const startMeter = useCallback(() => {
    const node = analyser.current;
    if (!node) return;
    const samples = new Uint8Array(node.frequencyBinCount);
    const read = () => {
      node.getByteTimeDomainData(samples);
      let peak = 0;
      for (const sample of samples)
        peak = Math.max(peak, Math.abs(sample - 128));
      setLevel(Math.min(1, peak / 64));
      frame.current = requestAnimationFrame(read);
    };
    read();
  }, []);

  const start = useCallback(
    (key: number) => {
      if (!stream.current || recorder.current) return;
      const chunks: Blob[] = [];
      const startedAt = Date.now();
      const next = new MediaRecorder(stream.current);
      next.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      next.onstop = () => {
        const blob = new Blob(chunks, {
          type: next.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        urls.current.push(url);
        setRecordings((current) => ({
          ...current,
          [key]: {
            blob,
            url,
            durationSeconds: Math.round((Date.now() - startedAt) / 1000),
          },
        }));
      };
      next.start();
      recorder.current = next;
      setRecordingKey(key);
      startMeter();
    },
    [startMeter],
  );

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    recorder.current = null;
    setRecordingKey(null);
    stopMeter();
  }, [stopMeter]);

  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      void audioContext.current?.close();
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  return {
    status,
    level,
    recordingKey,
    recordings,
    requestAccess,
    start,
    stop,
  };
}
