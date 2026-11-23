"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { InlineError } from "@/shared/components/practice/state-panels";
import { findSound, ipaSounds, type IpaGroup } from "../ipa-sounds";
import {
  markPracticed,
  parsePracticed,
  practicedSnapshot,
  subscribePracticed,
} from "../practice-progress";
import { GroupFilter, type GroupFilterValue } from "./group-filter";
import { IpaChart } from "./ipa-chart";
import { SoundDialog } from "./sound-dialog";

function updateUrl(slug: string | null, group: GroupFilterValue) {
  const params = new URLSearchParams(window.location.search);
  if (slug) params.set("sound", slug);
  else params.delete("sound");
  if (group === "all") params.delete("group");
  else params.set("group", group);
  const query = params.toString();
  // Next.js syncs useSearchParams with the native History API; replace keeps
  // the back button for leaving the page instead of stepping through sounds.
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
}

export function PronunciationWorkspace({
  initialSlug,
  initialGroup,
}: {
  initialSlug: string | null;
  initialGroup: IpaGroup | null;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [group, setGroup] = useState<GroupFilterValue>(initialGroup ?? "all");
  const [wordIndex, setWordIndex] = useState(0);
  // The server renders no progress; the client reads storage after hydration.
  const practicedRaw = useSyncExternalStore(
    subscribePracticed,
    practicedSnapshot,
    () => "",
  );
  const practiced = useMemo(() => parsePracticed(practicedRaw), [practicedRaw]);
  const opener = useRef<HTMLElement | null>(null);
  const sound = findSound(slug);

  const select = useCallback(
    (next: string) => {
      // Remember the tile that opened the dialog to give focus back on close.
      if (!slug && document.activeElement instanceof HTMLElement)
        opener.current = document.activeElement;
      setSlug(next);
      setWordIndex(0);
      updateUrl(next, group);
    },
    [group, slug],
  );

  const close = useCallback(() => {
    setSlug(null);
    updateUrl(null, group);
    const element = opener.current;
    opener.current = null;
    requestAnimationFrame(() => element?.focus());
  }, [group]);

  const changeGroup = (next: GroupFilterValue) => {
    setGroup(next);
    updateUrl(slug, next);
  };

  const onAssessed = useCallback((practicedSlug: string) => {
    markPracticed(practicedSlug);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 pt-2.5">
          <p className="w-fit rounded-md bg-(--sp-orange-soft) px-2.5 py-1 text-xs uppercase text-(--sp-brand) ring-1 ring-inset ring-(--sp-hero-line)">
            Pronunciation · IPA
          </p>
          <h1 className="mt-3 text-[28px] font-bold leading-9">
            International Phonetic Alphabet (IPA) Chart
          </h1>
          <p className="mt-2 text-[15px] text-(--sp-ink-2)">
            44 English sounds: 12 monophthongs, 8 diphthongs, and 24 consonants.
          </p>
        </div>
        <aside
          aria-label="Practice progress"
          className="w-full rounded-2xl border border-(--sp-line)/70 bg-white px-[18px] py-4 sm:w-60"
        >
          <p className="text-xs uppercase text-(--sp-ink-2)">Practiced</p>
          <p
            aria-live="polite"
            className="mt-1 text-[36px] font-bold leading-[44px] text-[#f4511e]"
          >
            {practiced.size} / {ipaSounds.length}
          </p>
          <p className="mt-1 text-[13px] text-(--sp-ink-2)">sounds scored</p>
        </aside>
      </header>

      <GroupFilter onChange={changeGroup} value={group} />

      {Boolean(slug) && !sound && (
        <InlineError>
          Sound not found. Please select a sound from the chart.
        </InlineError>
      )}

      <IpaChart filter={group} onSelect={select} practiced={practiced} />

      {sound && (
        <SoundDialog
          onAssessed={onAssessed}
          onClose={close}
          onSelectSound={select}
          onWordChange={setWordIndex}
          sound={sound}
          wordIndex={wordIndex}
        />
      )}
    </div>
  );
}
