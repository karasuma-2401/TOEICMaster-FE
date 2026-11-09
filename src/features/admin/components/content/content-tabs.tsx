import Link from "next/link";
import { adminFocus } from "./admin-styles";

export type ContentSkill = "listening-reading" | "speaking" | "writing";
export type ContentSection = "content" | "tests";

const skills: { id: ContentSkill; label: string }[] = [
  { id: "listening-reading", label: "Listening & Reading" },
  { id: "speaking", label: "Speaking" },
  { id: "writing", label: "Writing" },
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

/** Shared data-bank navigation: skills as tabs, Bài tập/Đề thi as a switch. */
export function ContentTabs({
  skill,
  section,
}: {
  skill: ContentSkill;
  section: ContentSection;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[var(--admin-border)]">
      <nav aria-label="Kỹ năng TOEIC" className="-mb-px flex gap-6">
        {skills.map((item) => {
          const active = item.id === skill;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm transition ${adminFocus} ${active ? "border-[var(--admin-brand-red)] font-medium text-[var(--admin-ink)]" : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"}`}
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
        className="mb-2 inline-flex rounded-lg bg-[#ebe5df] p-0.5"
      >
        {(Object.keys(sectionLabel) as ContentSection[]).map((item) => {
          const active = item === section;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1 text-[13px] transition ${adminFocus} ${active ? "bg-[var(--admin-surface)] font-medium text-[var(--admin-ink)] shadow-[0_1px_2px_rgb(43_39_36/12%)]" : "text-[var(--admin-ink-soft)] hover:text-[var(--admin-ink)]"}`}
              href={href(skill, item)}
              key={item}
            >
              {sectionLabel[item]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
