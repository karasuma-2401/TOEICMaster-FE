"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadSpeakingRecording } from "@/features/speaking/api";
import type { SpeakingAttempt } from "@/features/speaking/attempt";
import type { Recording } from "./use-voice-recorder";

export type UploadState = "uploading" | "uploaded" | "failed";

/** Uploads each finished recording once and exposes a retry for failures. */
export function useRecordingUploads(
  attemptId: string,
  recordings: Record<number, Recording>,
  onAttempt: (attempt: SpeakingAttempt) => void,
) {
  const [states, setStates] = useState<Record<number, UploadState>>({});
  const started = useRef(new Map<number, Recording>());
  const queues = useRef(new Map<number, Promise<void>>());

  const upload = useCallback(
    (position: number, recording: Recording) => {
      // A recovered microphone may produce a new take for the same position.
      // Serialize replacements so a slower, earlier upload cannot overwrite the newer one.
      const task = (queues.current.get(position) ?? Promise.resolve()).then(
        async () => {
          setStates((current) => ({ ...current, [position]: "uploading" }));
          try {
            onAttempt(
              await uploadSpeakingRecording(
                attemptId,
                position,
                recording.blob,
                recording.durationSeconds,
              ),
            );
            setStates((current) => ({ ...current, [position]: "uploaded" }));
          } catch {
            setStates((current) => ({ ...current, [position]: "failed" }));
          }
        },
      );
      queues.current.set(position, task);
      return task;
    },
    [attemptId, onAttempt],
  );

  useEffect(() => {
    for (const [key, recording] of Object.entries(recordings)) {
      const position = Number(key);
      if (started.current.get(position) === recording) continue;
      started.current.set(position, recording);
      void upload(position, recording);
    }
  }, [recordings, upload]);

  const retry = useCallback(
    (position: number) => {
      const recording = recordings[position];
      if (recording) void upload(position, recording);
    },
    [recordings, upload],
  );

  return { states, retry };
}
