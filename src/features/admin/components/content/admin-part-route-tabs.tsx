import Link from "next/link";
import {
  partQuestionCount,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
import { type SpeakingPart } from "@/features/speaking/types";
import { type WritingPart } from "@/features/writing/types";
import { adminFocus } from "./admin-styles";

type PartRouteTab = {
  part: number;
  label: string;
  detail: string;
};

const speakingTabs: readonly PartRouteTab[] = [1, 2, 3, 4, 5].map((part) => {
  const typedPart = part as SpeakingPart;
  return {
    part,
    label: speakingPartSpecs[typedPart].subtitle,
    detail: `${partQuestionCount(typedPart)} questions/test`,
  };
});

const writingTabs: readonly PartRouteTab[] = [
  {
    part: 1,
    label: "Write a sentence based on a picture",
    detail: "5 questions/test",
  },
  {
    part: 2,
    label: "Respond to a written request",
    detail: "2 questions/test",
  },
  { part: 3, label: "Write an opinion essay", detail: "1 question/test" },
];

export function AdminPartRouteTabs({
  activePart,
  skill,
}: {
  activePart: SpeakingPart | WritingPart;
  skill: "speaking" | "writing";
}) {
  const tabs = skill === "speaking" ? speakingTabs : writingTabs;

  return (
    <nav
      aria-label={`${skill === "speaking" ? "Speaking" : "Writing"} Parts`}
      className="mt-5 flex overflow-x-auto border-b border-[var(--admin-border)]"
    >
      {tabs.map((tab) => {
        const active = tab.part === activePart;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`min-w-44 flex-1 px-5 py-4 transition ${adminFocus} ${active ? "bg-[#fff0e8] text-[var(--admin-brand-red)]" : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-ink)]"}`}
            href={`/admin/content/${skill}/part-${tab.part}`}
            key={tab.part}
          >
            <span className="block text-sm font-semibold">Part {tab.part}</span>
            <span className="mt-1 block text-xs font-medium">
              {tab.label} · {tab.detail}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
