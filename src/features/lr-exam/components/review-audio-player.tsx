"use client";

import { useEffect, useRef, useState } from "react";
import { getLrMediaUrl } from "@/features/lr-exam/api";
import { formatClock } from "@/shared/ui/format-time";
import { focusRing, secondaryButton } from "./exam-ui";

const PLAYBACK_RATES = ["0.8", "1.0", "1.2"] as const;
type PlaybackRateOption = (typeof PLAYBACK_RATES)[number];

function isAbortError(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "name" in cause &&
    (cause as { name?: unknown }).name === "AbortError"
  );
}

export function ReviewAudioPlayer({
  attemptId,
  assetId,
  cachedUrl,
  durationMs,
  onCacheUrl,
}: {
  attemptId: string;
  assetId: string;
  cachedUrl?: string;
  durationMs: number | null;
  onCacheUrl: (assetId: string, url: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [measuredDurationSec, setMeasuredDurationSec] = useState<number | null>(
    null,
  );
  const [rate, setRate] = useState<PlaybackRateOption>("1.0");

  const initialDurationSec =
    durationMs && durationMs > 0 ? Math.round(durationMs / 1000) : 0;
  const totalSeconds = measuredDurationSec ?? initialDurationSec;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !cachedUrl) return;
    if (audio.getAttribute("src") !== cachedUrl) {
      audio.src = cachedUrl;
    }
  }, [cachedUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = Number(rate);
    }
  }, [rate]);

  async function handleToggle() {
    const audio = audioRef.current;
    if (!audio || loading) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setError(null);
    let url = cachedUrl;
    if (!url) {
      setLoading(true);
      try {
        const media = await getLrMediaUrl(attemptId, "audio", assetId);
        url = media.url;
        onCacheUrl(assetId, url);
      } catch (cause) {
        setLoading(false);
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải audio xem lại.",
        );
        return;
      }
      setLoading(false);
    }

    if (audio.getAttribute("src") !== url) {
      audio.src = url;
    }
    audio.playbackRate = Number(rate);
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (cause) {
      setIsPlaying(false);
      if (!isAbortError(cause)) {
        setError(
          cause instanceof Error ? cause.message : "Không thể phát audio.",
        );
      }
    }
  }

  function handleSeek(nextSeconds: number) {
    setCurrentSeconds(nextSeconds);
    if (audioRef.current) {
      audioRef.current.currentTime = nextSeconds;
    }
  }

  function handleRateChange(nextRate: PlaybackRateOption) {
    setRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = Number(nextRate);
    }
  }

  return (
    <section
      aria-label="Audio xem lại câu hỏi"
      className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4"
      data-testid="lr-review-audio-player"
    >
      <audio
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          const duration = audioRef.current?.duration;
          if (duration && Number.isFinite(duration) && duration > 0) {
            setMeasuredDurationSec(Math.round(duration));
          }
        }}
        onTimeUpdate={() => {
          const time = audioRef.current?.currentTime;
          if (time !== undefined && Number.isFinite(time)) {
            setCurrentSeconds(Math.floor(time));
          }
        }}
        preload="none"
        ref={audioRef}
      >
        <track kind="captions" />
      </audio>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className={`${secondaryButton} min-h-[44px] px-4 text-xs`}
          data-testid="lr-review-audio-toggle"
          disabled={loading}
          onClick={() => void handleToggle()}
          type="button"
        >
          {loading
            ? "Đang tải audio…"
            : isPlaying
              ? "Tạm dừng audio"
              : "Phát audio"}
        </button>

        <span className="text-xs font-semibold tabular-nums text-[#475569]">
          {formatClock(currentSeconds)} / {formatClock(totalSeconds)}
        </span>

        <select
          aria-label="Tốc độ phát"
          className={`min-h-[44px] rounded-xl border border-[#d9d2ce] bg-white px-3 text-xs font-semibold text-[#4c4542] ${focusRing}`}
          data-testid="lr-review-audio-speed"
          onChange={(event) =>
            handleRateChange(event.target.value as PlaybackRateOption)
          }
          value={rate}
        >
          {PLAYBACK_RATES.map((option) => (
            <option key={option} value={option}>
              {option}x
            </option>
          ))}
        </select>
      </div>

      <input
        aria-label="Tua audio"
        className={`h-2 w-full cursor-pointer accent-[#ff5a1f] ${focusRing}`}
        data-testid="lr-review-audio-seek"
        max={Math.max(1, totalSeconds)}
        min={0}
        onChange={(event) => handleSeek(Number(event.target.value))}
        step={1}
        type="range"
        value={Math.min(currentSeconds, Math.max(1, totalSeconds))}
      />

      {error ? (
        <p className="text-xs font-medium text-[#dc2626]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
