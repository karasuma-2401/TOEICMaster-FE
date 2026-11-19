"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ListeningTrack {
  blockId: string;
  part: number;
  first: number;
  last: number;
  audioAssetId: string;
  url: string;
  durationMs: number;
}

interface PersistedListeningProgress {
  activeIndex: number;
  currentTimeSec: number;
}

const SLIDING_WINDOW_AHEAD = 3;

function storageKey(attemptId: string) {
  return `lr-listening-progress:${attemptId}`;
}

function readPersistedProgress(
  attemptId: string | undefined,
  trackCount: number,
): PersistedListeningProgress | null {
  if (!attemptId || trackCount <= 0 || typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(storageKey(attemptId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const activeIndex =
      typeof record.activeIndex === "number" &&
      Number.isInteger(record.activeIndex)
        ? Math.min(Math.max(0, record.activeIndex), trackCount - 1)
        : 0;
    const currentTimeSec =
      typeof record.currentTimeSec === "number" &&
      Number.isFinite(record.currentTimeSec) &&
      record.currentTimeSec >= 0
        ? record.currentTimeSec
        : 0;
    return { activeIndex, currentTimeSec };
  } catch {
    return null;
  }
}

function writePersistedProgress(
  attemptId: string | undefined,
  activeIndex: number,
  currentTimeSec: number,
) {
  if (!attemptId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      storageKey(attemptId),
      JSON.stringify({ activeIndex, currentTimeSec }),
    );
  } catch {
    // Ignore storage quota or private-mode failures.
  }
}

export function useSequentialListeningPlayer({
  attemptId,
  tracks,
  enabled,
}: {
  attemptId?: string;
  tracks: ListeningTrack[];
  enabled: boolean;
}) {
  const initialProgress = readPersistedProgress(attemptId, tracks.length);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(
    () => initialProgress?.activeIndex ?? 0,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [measuredDurations, setMeasuredDurations] = useState<
    Record<string, number>
  >({});
  const [currentTrackElapsedMs, setCurrentTrackElapsedMs] = useState(() =>
    Math.round((initialProgress?.currentTimeSec ?? 0) * 1000),
  );
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | undefined>(
    undefined,
  );

  const activeIndexRef = useRef(activeIndex);
  const isPlayingRef = useRef(isPlaying);
  const tracksRef = useRef(tracks);
  const blobUrlsRef = useRef<Map<number, string>>(new Map());
  const failedIndicesRef = useRef<Set<number>>(new Set());
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingResumeTimeSecRef = useRef<number>(
    initialProgress?.currentTimeSec ?? 0,
  );

  tracksRef.current = tracks;
  activeIndexRef.current = activeIndex;
  isPlayingRef.current = isPlaying;

  const tracksSignature = useMemo(
    () => tracks.map((track) => `${track.blockId}:${track.url}`).join("|"),
    [tracks],
  );

  const durationsMs = useMemo(
    () =>
      tracks.map(
        (track) => measuredDurations[track.blockId] ?? track.durationMs,
      ),
    [tracks, measuredDurations],
  );

  const startOffsetsMs = useMemo(() => {
    const offsets: number[] = [];
    let running = 0;
    for (const duration of durationsMs) {
      offsets.push(running);
      running += Math.max(0, duration);
    }
    return offsets;
  }, [durationsMs]);

  const totalDurationMs = useMemo(
    () => durationsMs.reduce((sum, duration) => sum + Math.max(0, duration), 0),
    [durationsMs],
  );

  const activeTrack = tracks[activeIndex];
  const globalElapsedMs =
    (startOffsetsMs[activeIndex] ?? 0) + currentTrackElapsedMs;

  const revokeAllBlobs = useCallback(() => {
    for (const url of blobUrlsRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    blobUrlsRef.current.clear();
  }, []);

  const attachAndMaybePlay = useCallback((objectUrl: string, play: boolean) => {
    setActiveBlobUrl(objectUrl);
    setIsBuffering(false);
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.src !== objectUrl) {
      audio.src = objectUrl;
    }
    if (play) {
      void audio.play().catch((cause) => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setError(
          cause instanceof Error
            ? cause.message
            : "Trình duyệt chặn tự động phát audio. Vui lòng nhấn phát lại.",
        );
      });
    }
  }, []);

  const pumpQueueRef = useRef<() => void>(() => {});

  const pumpQueue = useCallback(() => {
    if (!enabled) return;
    const currentTracks = tracksRef.current;
    if (currentTracks.length === 0 || isFetchingRef.current) return;

    const currentIdx = activeIndexRef.current;
    const windowEnd = Math.min(
      currentTracks.length - 1,
      currentIdx + SLIDING_WINDOW_AHEAD,
    );

    let nextToFetch: number | null = null;
    for (let idx = currentIdx; idx <= windowEnd; idx += 1) {
      if (!blobUrlsRef.current.has(idx) && !failedIndicesRef.current.has(idx)) {
        nextToFetch = idx;
        break;
      }
    }
    if (nextToFetch === null) return;

    const track = currentTracks[nextToFetch];
    if (!track) return;

    isFetchingRef.current = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    void fetch(track.url, {
      credentials: "omit",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Không thể tải audio (${response.status}).`);
        }
        const blob = await response.blob();
        if (controller.signal.aborted) return;

        const objectUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.set(nextToFetch, objectUrl);

        if (nextToFetch === activeIndexRef.current) {
          attachAndMaybePlay(objectUrl, isPlayingRef.current);
        }
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        failedIndicesRef.current.add(nextToFetch);
        if (nextToFetch === activeIndexRef.current) {
          setIsBuffering(false);
          setIsPlaying(false);
          isPlayingRef.current = false;
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải đoạn audio Listening.",
          );
        }
      })
      .finally(() => {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        isFetchingRef.current = false;
        if (!controller.signal.aborted) {
          pumpQueueRef.current();
        }
      });
  }, [attachAndMaybePlay, enabled]);

  pumpQueueRef.current = pumpQueue;

  // Reset & start queue when attemptId, enabled, or track list changes.
  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    isFetchingRef.current = false;
    failedIndicesRef.current.clear();
    revokeAllBlobs();
    setError(null);
    setActiveBlobUrl(undefined);

    if (!enabled || tracks.length === 0) {
      setIsBuffering(false);
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    const restored = readPersistedProgress(attemptId, tracks.length);
    const startIdx = restored?.activeIndex ?? 0;
    const resumeSec = restored?.currentTimeSec ?? 0;

    activeIndexRef.current = startIdx;
    setActiveIndex(startIdx);
    pendingResumeTimeSecRef.current = resumeSec;
    setCurrentTrackElapsedMs(Math.round(resumeSec * 1000));
    pumpQueue();

    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      isFetchingRef.current = false;
      revokeAllBlobs();
    };
    // tracksSignature captures identity of tracks array content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, enabled, tracksSignature, pumpQueue, revokeAllBlobs]);

  // Keep <audio> element src synchronized with activeBlobUrl.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (activeBlobUrl && audio.src !== activeBlobUrl) {
      audio.src = activeBlobUrl;
    }
  }, [activeBlobUrl]);

  const togglePlay = useCallback(async () => {
    if (!enabled || tracksRef.current.length === 0) return;

    if (isPlayingRef.current) {
      audioRef.current?.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }

    setError(null);
    isPlayingRef.current = true;
    setIsPlaying(true);

    const readyUrl = blobUrlsRef.current.get(activeIndexRef.current);
    if (!readyUrl) {
      failedIndicesRef.current.delete(activeIndexRef.current);
      setIsBuffering(true);
      pumpQueue();
      return;
    }

    setIsBuffering(false);
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.src !== readyUrl) {
      audio.src = readyUrl;
    }
    try {
      await audio.play();
    } catch (cause) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể phát audio. Vui lòng thử lại.",
      );
    }
  }, [enabled, pumpQueue]);

  const onLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    const track = tracksRef.current[activeIndexRef.current];
    if (!audio || !track) return;

    const durationSec = audio.duration;
    if (Number.isFinite(durationSec) && durationSec > 0) {
      const actualMs = Math.round(durationSec * 1000);
      setMeasuredDurations((prev) =>
        prev[track.blockId] === actualMs
          ? prev
          : { ...prev, [track.blockId]: actualMs },
      );
    }

    if (pendingResumeTimeSecRef.current > 0) {
      const resumeSec = pendingResumeTimeSecRef.current;
      pendingResumeTimeSecRef.current = 0;
      audio.currentTime = resumeSec;
      setCurrentTrackElapsedMs(Math.round(resumeSec * 1000));
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const currentTimeSec = Number.isFinite(audio.currentTime)
      ? Math.max(0, audio.currentTime)
      : 0;
    setCurrentTrackElapsedMs(Math.round(currentTimeSec * 1000));
    writePersistedProgress(attemptId, activeIndexRef.current, currentTimeSec);
  }, [attemptId]);

  const onEnded = useCallback(() => {
    const prevIdx = activeIndexRef.current;
    const prevUrl = blobUrlsRef.current.get(prevIdx);
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
      blobUrlsRef.current.delete(prevIdx);
    }

    const nextIdx = prevIdx + 1;
    if (nextIdx >= tracksRef.current.length) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      setActiveBlobUrl(undefined);
      return;
    }

    activeIndexRef.current = nextIdx;
    setActiveIndex(nextIdx);
    setCurrentTrackElapsedMs(0);
    pendingResumeTimeSecRef.current = 0;
    writePersistedProgress(attemptId, nextIdx, 0);

    const nextUrl = blobUrlsRef.current.get(nextIdx);
    if (nextUrl) {
      attachAndMaybePlay(nextUrl, isPlayingRef.current);
    } else {
      failedIndicesRef.current.delete(nextIdx);
      setActiveBlobUrl(undefined);
      setIsBuffering(true);
    }

    pumpQueue();
  }, [attemptId, attachAndMaybePlay, pumpQueue]);

  return {
    audioRef,
    activeIndex,
    activeTrack,
    isPlaying,
    isBuffering,
    error,
    globalElapsedMs,
    totalDurationMs,
    togglePlay,
    onLoadedMetadata,
    onTimeUpdate,
    onEnded,
  };
}
