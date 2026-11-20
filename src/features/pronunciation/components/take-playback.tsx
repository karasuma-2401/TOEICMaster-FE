"use client";

import { useRef, useState } from "react";
import { focusRing } from "@/shared/components/practice/styles";
import { formatClock } from "@/shared/ui/format-time";
import { PlayIcon, StopIcon } from "./icons";

/** Replay of the learner's own take, laid out like the Speaking take playback. */
export function TakePlayback({
  url,
  durationSeconds,
}: {
  url: string;
  durationSeconds: number;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-(--sp-subtle) px-3 py-2.5">
      <button
        className={`inline-flex cursor-pointer items-center gap-2 rounded-md text-sm ${focusRing}`}
        onClick={() =>
          playing ? audio.current?.pause() : void audio.current?.play()
        }
        type="button"
      >
        {playing ? <StopIcon /> : <PlayIcon />}
        {playing ? "Dừng nghe lại" : "Nghe lại bản thu"}
      </button>
      <p className="flex gap-10 text-xs text-(--sp-ink-2)">
        <span>{formatClock(time)}</span>
        <span>{formatClock(durationSeconds)}</span>
      </p>
      <audio
        key={url}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        preload="metadata"
        ref={audio}
        src={url}
      >
        <track kind="captions" />
      </audio>
    </div>
  );
}
