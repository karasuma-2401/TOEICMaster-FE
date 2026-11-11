import Link from "next/link";
import { adminFocus } from "./admin-styles";

export type ContentSkill = "listening-reading" | "speaking" | "writing";
export type ContentSection = "content" | "tests";

const skills: { id: ContentSkill; label: string; parts: string }[] = [
  { id: "listening-reading", label: "Listening & Reading", parts: "7 Part" },
  { id: "speaking", label: "Speaking", parts: "5 Part" },
  { id: "writing", label: "Writing", parts: "3 Part" },
];

const sectionLabel: Record<ContentSection, string> = {
  content: "Bài tập",
  tests: "Đề thi",
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
    <div className="mb-5 border-b border-[var(--admin-border)]">
      <div className="flex min-h-14 flex-wrap items-end justify-between gap-x-6">
        <nav aria-label="Kỹ năng TOEIC" className="flex overflow-x-auto">
          {skills.map((item) => {
            const active = item.id === skill;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`border-b-2 px-4 py-4 text-sm font-semibold transition ${adminFocus} ${active ? "border-[var(--admin-brand-red)] text-[var(--admin-ink)]" : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink-soft)]"}`}
                href={href(item.id, section)}
                key={item.id}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <nav
          aria-label="Phân loại dữ liệu"
          className="mb-2 inline-flex overflow-hidden rounded-lg bg-[var(--admin-surface-muted)] p-1"
        >
          {(Object.keys(sectionLabel) as ContentSection[]).map((item) => {
            const active = item === section;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${adminFocus} ${active ? "bg-white text-[var(--admin-ink)] shadow-sm" : "text-[var(--admin-muted)] hover:text-[var(--admin-ink-soft)]"}`}
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
