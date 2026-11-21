"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMicSession } from "@/features/speaking/mic/mic-session-provider";
export type { MicrophoneStatus } from "@/features/speaking/mic/mic-session-provider";

export interface Recording {
  blob: Blob;
  url: string;
  durationSeconds: number;
}

/** Records answers without owning or reopening the layout's microphone stream. */
export function useVoiceRecorder() {
  const mic = useMicSession();
  const { stream, markLost } = mic;
  const [recordingKey, setRecordingKey] = useState<number | null>(null);
  const [recordings, setRecordings] = useState<Record<number, Recording>>({});
  const recorder = useRef<MediaRecorder | null>(null);
  const endTimes = useRef(new WeakMap<MediaRecorder, number>());
  const urls = useRef<string[]>([]);
  const mounted = useRef(true);

  const start = useCallback(
    (key: number) => {
      const source = stream.current;
      if (
        !source
          ?.getAudioTracks()
          .some((track) => track.readyState === "live") ||
        recorder.current
      )
        return;
      try {
        const chunks: Blob[] = [];
        const startedAt = Date.now();
        const next = new MediaRecorder(source);
        next.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        next.onstop = () => {
          if (!mounted.current || chunks.length === 0) return;
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
              durationSeconds: Math.max(
                1,
                Math.ceil(
                  ((endTimes.current.get(next) ?? Date.now()) - startedAt) /
                    1000,
                ),
              ),
            },
          }));
        };
        next.onerror = () => {
          recorder.current = null;
          setRecordingKey(null);
          markLost();
        };
        next.start();
        recorder.current = next;
        setRecordingKey(key);
      } catch {
        markLost();
      }
    },
    [stream, markLost],
  );

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") {
      endTimes.current.set(recorder.current, Date.now());
      recorder.current.stop();
    }
    recorder.current = null;
    setRecordingKey(null);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const objectUrls = urls.current;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      recorder.current = null;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return {
    status: mic.status,
    micLost: mic.status === "lost",
    deviceLabel: mic.deviceLabel,
    level: mic.level,
    recordingKey,
    recordings,
    requestAccess: mic.acquire,
    start,
    stop,
  };
}
