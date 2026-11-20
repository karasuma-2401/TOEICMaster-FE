"use client";

import { focusRing } from "@/shared/components/practice/styles";
import { useWordSpeech } from "../hooks/use-word-speech";
import type { IpaExample } from "../ipa-sounds";
import { SpeakerIcon } from "./icons";
import { pill, pillActive, pillIdle } from "./tones";

export function Transcription({ example }: { example: IpaExample }) {
  const [start, end] = example.highlight;
  return (
    <span className="text-(--sp-ink-2)">
      /{example.ipa.slice(0, start)}
      <mark className="bg-transparent text-(--sp-brand)">
        {example.ipa.slice(start, end)}
      </mark>
      {example.ipa.slice(end)}/
    </span>
  );
}

export function ExampleWordList({
  examples,
  selectedIndex,
  onSelect,
}: {
  examples: readonly IpaExample[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const speech = useWordSpeech();
  return (
    <ul className="flex flex-wrap gap-2">
      {examples.map((example, index) => {
        const selected = index === selectedIndex;
        return (
          <li className="flex items-center gap-1" key={example.word}>
            <button
              aria-label={`Luyện từ ${example.word}`}
              aria-pressed={selected}
              className={`${pill} ${focusRing} ${selected ? pillActive : pillIdle}`}
              onClick={() => onSelect(index)}
              type="button"
            >
              <span className={selected ? "" : "text-(--sp-ink)"}>
                {example.word}
              </span>
              <span className="text-[13px] font-normal">
                <Transcription example={example} />
              </span>
            </button>
            {speech.supported && (
              <button
                aria-label={`Nghe từ ${example.word}`}
                className={`grid size-9 cursor-pointer place-items-center rounded-md text-(--sp-ink-2) transition hover:bg-(--sp-subtle) hover:text-(--sp-ink) ${focusRing}`}
                onClick={() => speech.speak(example.word)}
                type="button"
              >
                <SpeakerIcon />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
