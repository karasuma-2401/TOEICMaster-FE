import type { ReactNode } from "react";
import {
  consonantRows,
  groupLabels,
  soundsByGroup,
  type IpaGroup,
  type IpaSound,
} from "../ipa-sounds";
import type { GroupFilterValue } from "./group-filter";
import { IpaSoundTile } from "./ipa-sound-tile";

export function IpaChart({
  filter,
  practiced,
  onSelect,
}: {
  filter: GroupFilterValue;
  practiced: ReadonlySet<string>;
  onSelect: (slug: string) => void;
}) {
  const tile = (sound: IpaSound) => (
    <IpaSoundTile
      key={sound.slug}
      onSelect={onSelect}
      practiced={practiced.has(sound.slug)}
      sound={sound}
    />
  );
  const show = (group: IpaGroup) => filter === "all" || filter === group;
  const bothVowels = show("monophthong") && show("diphthong");

  return (
    <div className="flex flex-col gap-8">
      {(show("monophthong") || show("diphthong")) && (
        <div
          className={`grid gap-8 ${bothVowels ? "xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}`}
        >
          {show("monophthong") && (
            <GroupSection group="monophthong" practiced={practiced}>
              <div
                className={`grid grid-cols-3 gap-3 min-[420px]:grid-cols-4 sm:grid-cols-6 ${bothVowels ? "xl:grid-cols-4 2xl:grid-cols-6" : "lg:grid-cols-8 xl:grid-cols-12"}`}
              >
                {soundsByGroup("monophthong").map(tile)}
              </div>
            </GroupSection>
          )}
          {show("diphthong") && (
            <GroupSection group="diphthong" practiced={practiced}>
              <div
                className={`grid grid-cols-3 gap-3 min-[420px]:grid-cols-4 ${bothVowels ? "xl:grid-cols-3 2xl:grid-cols-4" : "sm:grid-cols-8"}`}
              >
                {soundsByGroup("diphthong").map(tile)}
              </div>
            </GroupSection>
          )}
        </div>
      )}
      {show("consonant") && (
        <GroupSection group="consonant" practiced={practiced}>
          <ConsonantGrid tile={tile} />
        </GroupSection>
      )}
    </div>
  );
}

function GroupSection({
  group,
  practiced,
  children,
}: {
  group: IpaGroup;
  practiced: ReadonlySet<string>;
  children: ReactNode;
}) {
  const sounds = soundsByGroup(group);
  const done = sounds.filter((sound) => practiced.has(sound.slug)).length;
  const headingId = `ipa-group-${group}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-lg font-semibold" id={headingId}>
          {groupLabels[group]}
        </h2>
        <p className="text-[13px] text-(--sp-ink-2)">
          {sounds.length} âm{done > 0 ? ` · Đã luyện ${done}` : ""}
        </p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ConsonantGrid({ tile }: { tile: (sound: IpaSound) => ReactNode }) {
  const { pairs, others } = consonantRows();
  return (
    <div className="flex flex-col gap-5">
      <ul
        aria-label="Cặp vô thanh và hữu thanh"
        className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4"
      >
        {pairs.map(([voiceless, voiced]) => (
          <li
            className="grid grid-cols-2 gap-2 rounded-2xl bg-(--sp-subtle) p-2"
            key={voiceless.slug}
          >
            {tile(voiceless)}
            {tile(voiced)}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-3 gap-3 min-[420px]:grid-cols-4 lg:grid-cols-8">
        {others.map(tile)}
      </div>
    </div>
  );
}
