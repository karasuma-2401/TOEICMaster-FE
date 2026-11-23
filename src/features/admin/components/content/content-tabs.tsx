import Link from "next/link";
import type { ReactNode } from "react";
import { adminFocus } from "./admin-styles";

export type ContentSkill = "listening-reading" | "speaking" | "writing";
export type ContentSection = "content" | "tests";

export interface AdminUnderlineTabItem<T extends string = string> {
  id: T;
  label: string;
}

const adminUnderlineTabClass = (active: boolean) =>
  `border-b-2 px-4 py-4 text-sm font-semibold transition ${adminFocus} ${
    active
      ? "border-(--admin-brand-red) text-(--admin-ink)"
      : "border-transparent text-(--admin-muted) hover:text-(--admin-ink-soft)"
  }`;

/** Reusable underline tab bar matching the Admin ContentTabs design language. */
export function AdminUnderlineTabs<T extends string>({
  ariaLabel,
  items,
  activeId,
  onSelect,
  trailing,
}: {
  ariaLabel: string;
  items: ReadonlyArray<AdminUnderlineTabItem<T>>;
  activeId: T;
  onSelect: (id: T) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-5 border-b border-(--admin-border)">
      <div className="flex min-h-14 flex-wrap items-end justify-between gap-x-6">
        <nav aria-label={ariaLabel} className="flex overflow-x-auto">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={adminUnderlineTabClass(active)}
                key={item.id}
                onClick={() => onSelect(item.id)}
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        {trailing}
      </div>
    </div>
  );
}

const skills: { id: ContentSkill; label: string; parts: string }[] = [
  { id: "listening-reading", label: "Listening & Reading", parts: "7 Parts" },
  { id: "speaking", label: "Speaking", parts: "5 Parts" },
  { id: "writing", label: "Writing", parts: "3 Parts" },
];

const sectionLabel: Record<ContentSection, string> = {
  content: "Exercises",
  tests: "Tests",
};

function href(skill: ContentSkill, section: ContentSection) {
  if (skill === "listening-reading")
    return section === "content" ? "/admin/exams" : "/admin/exams?tab=tests";
  return section === "content"
    ? `/admin/content/${skill}`
    : `/admin/tests/${skill}`;
}

/** Shared data-bank navigation across Listening & Reading, Speaking, and Writing. */
export function ContentTabs({
  skill,
  section,
}: {
  skill: ContentSkill;
  section: ContentSection;
}) {
  return (
    <div className="mb-5 border-b border-(--admin-border)">
      <div className="flex min-h-14 flex-wrap items-end justify-between gap-x-6">
        <nav aria-label="TOEIC skills" className="flex overflow-x-auto">
          {skills.map((item) => {
            const active = item.id === skill;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={adminUnderlineTabClass(active)}
                href={href(item.id, section)}
                key={item.id}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <nav
          aria-label="Data categories"
          className="mb-2 inline-flex overflow-hidden rounded-lg bg-(--admin-surface-muted) p-1"
        >
          {(Object.keys(sectionLabel) as ContentSection[]).map((item) => {
            const active = item === section;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${adminFocus} ${active ? "bg-white text-(--admin-ink) shadow-sm" : "text-(--admin-muted) hover:text-(--admin-ink-soft)"}`}
                href={href(skill, item)}
                key={item}
              >
                {sectionLabel[item]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
