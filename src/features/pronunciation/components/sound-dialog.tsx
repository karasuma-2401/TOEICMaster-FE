"use client";

import { useEffect, useRef } from "react";
import { focusRing } from "@/shared/components/practice/styles";
import {
  findSound,
  groupLabels,
  ipaSounds,
  subgroupLabels,
  type IpaSound,
} from "../ipa-sounds";
import { ExampleWordList } from "./example-word-list";
import { PracticeRecorder } from "./practice-recorder";
import { SampleAudioButton } from "./sample-audio-button";

/**
 * Details of one sound in a modal: how to say it, example words and the
 * recorder. A native <dialog> keeps focus inside and closes on Escape.
 */
export function SoundDialog({
  sound,
  wordIndex,
  onWordChange,
  onSelectSound,
  onClose,
  onAssessed,
}: {
  sound: IpaSound;
  wordIndex: number;
  onWordChange: (index: number) => void;
  onSelectSound: (slug: string) => void;
  onClose: () => void;
  onAssessed: (slug: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const partner = findSound(sound.pairSlug);
  const position = ipaSounds.findIndex((item) => item.slug === sound.slug);
  const previous = ipaSounds[position - 1];
  const next = ipaSounds[position + 1];
  const example = sound.examples[wordIndex] ?? sound.examples[0];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) {
      if (typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
    }
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // A click on the backdrop lands on the <dialog> itself: close, like Escape.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === element) onCloseRef.current();
    };
    element.addEventListener("click", closeOnBackdrop);
    return () => element.removeEventListener("click", closeOnBackdrop);
  }, []);

  // Each sound starts at the top with its heading focused for screen readers.
  useEffect(() => {
    dialog.current?.querySelector("[data-dialog-body]")?.scrollTo?.(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [sound.slug]);

  return (
    <dialog
      aria-labelledby="ipa-dialog-heading"
      className="sp-theme fixed inset-0 m-auto flex max-h-[min(88dvh,46rem)] w-[min(36rem,calc(100vw-2rem))] max-w-none flex-col overflow-hidden rounded-2xl border border-(--sp-line)/70 bg-white p-0 shadow-2xl backdrop:bg-slate-950/45"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialog}
    >
      <header className="flex items-start gap-3 border-b border-(--sp-line)/70 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2
            className="text-[28px] font-bold leading-9 outline-none"
            id="ipa-dialog-heading"
            ref={heading}
            tabIndex={-1}
          >
            <span className="sr-only">Sound </span>/{sound.symbol}/
          </h2>
          <p className="mt-1 text-[13px] text-(--sp-ink-2)">
            {groupLabels[sound.group]} · {subgroupLabels[sound.subgroup]}
            {partner && (
              <>
                {" · Paired with "}
                <button
                  className={`cursor-pointer underline underline-offset-4 hover:text-(--sp-ink) ${focusRing}`}
                  onClick={() => onSelectSound(partner.slug)}
                  type="button"
                >
                  /{partner.symbol}/
                </button>
              </>
            )}
          </p>
        </div>
        <SampleAudioButton
          key={sound.audioSrc}
          src={sound.audioSrc}
          symbol={sound.symbol}
        />
        <button
          aria-label="Close"
          className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-md text-(--sp-ink-2) transition hover:bg-(--sp-subtle) hover:text-(--sp-ink) ${focusRing}`}
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 18 18 6M6 6l12 12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </header>

      <div
        className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 py-4"
        data-dialog-body
      >
        <section aria-labelledby="ipa-how-heading">
          <h3 className="text-[15px] font-semibold" id="ipa-how-heading">
            How to pronounce
          </h3>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[15px] text-(--sp-ink-2)">
            {sound.articulation.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2 text-[13px] text-(--sp-ink-2)">
            Common mistake: {sound.commonMistake}
          </p>
        </section>

        <section aria-labelledby="ipa-words-heading">
          <h3 className="text-[15px] font-semibold" id="ipa-words-heading">
            Example words
          </h3>
          <div className="mt-2">
            <ExampleWordList
              examples={sound.examples}
              onSelect={onWordChange}
              selectedIndex={wordIndex}
            />
          </div>
        </section>

        <PracticeRecorder
          example={example}
          key={sound.slug}
          onAssessed={onAssessed}
          sound={sound}
        />

        {sound.scoringNote && (
          <p className="text-xs text-(--sp-ink-3)">{sound.scoringNote}</p>
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-(--sp-line)/70 px-3 py-1.5">
        <NavButton
          direction="previous"
          onSelect={onSelectSound}
          target={previous}
        />
        <a
          className={`whitespace-nowrap text-xs text-(--sp-ink-3) underline underline-offset-4 hover:text-(--sp-ink-2) ${focusRing}`}
          href="/audio/ipa/CREDITS.md"
          rel="noreferrer"
          target="_blank"
        >
          Audio credits
        </a>
        <NavButton direction="next" onSelect={onSelectSound} target={next} />
      </footer>
    </dialog>
  );
}

function NavButton({
  target,
  direction,
  onSelect,
}: {
  target: IpaSound | undefined;
  direction: "previous" | "next";
  onSelect: (slug: string) => void;
}) {
  if (!target) return <span className="min-w-20" />;
  const label = direction === "previous" ? "Previous" : "Next";
  return (
    <button
      aria-label={`${label}: /${target.symbol}/`}
      className={`inline-flex min-h-10 min-w-20 cursor-pointer items-center gap-1 rounded-md px-2.5 text-[13px] text-(--sp-ink-2) transition hover:bg-(--sp-subtle) hover:text-(--sp-ink) ${direction === "next" ? "justify-end" : ""} ${focusRing}`}
      onClick={() => onSelect(target.slug)}
      type="button"
    >
      {direction === "previous" && <span aria-hidden="true">←</span>}
      {label} /{target.symbol}/
      {direction === "next" && <span aria-hidden="true">→</span>}
    </button>
  );
}
