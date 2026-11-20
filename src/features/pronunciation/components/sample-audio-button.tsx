"use client";

import { useEffect, useRef, useState } from "react";
import { InlineError } from "@/shared/components/practice/state-panels";
import { focusRing } from "@/shared/components/practice/styles";
import { SpeakerIcon, StopIcon } from "./icons";
import { pill, pillIdle } from "./tones";

export function SampleAudioButton({
  src,
  symbol,
}: {
  src: string;
  symbol: string;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  // Stop the sample when the sound changes (the parent remounts by `src`).
  useEffect(() => {
    const element = audio.current;
    return () => element?.pause();
  }, []);

  async function toggle() {
    const element = audio.current;
    if (!element) return;
    if (playing) {
      element.pause();
      element.currentTime = 0;
      setPlaying(false);
      return;
    }
    setFailed(false);
    try {
      element.currentTime = 0;
      await element.play();
      setPlaying(true);
    } catch {
      setFailed(true);
      setPlaying(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        aria-label={
          playing ? `Dừng âm mẫu /${symbol}/` : `Nghe âm mẫu /${symbol}/`
        }
        className={`${pill} ${pillIdle} ${focusRing} whitespace-nowrap px-3 text-(--sp-ink)`}
        onClick={() => void toggle()}
        type="button"
      >
        {playing ? <StopIcon /> : <SpeakerIcon />}
        {playing ? "Dừng" : "Nghe âm mẫu"}
      </button>
      <audio
        onEnded={() => setPlaying(false)}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
        preload="none"
        ref={audio}
        src={src}
      >
        <track kind="captions" />
      </audio>
      {failed && (
        <div className="absolute right-0 top-full z-10 mt-2 w-60">
          <InlineError>Không phát được audio mẫu của âm này.</InlineError>
        </div>
      )}
    </div>
  );
}
