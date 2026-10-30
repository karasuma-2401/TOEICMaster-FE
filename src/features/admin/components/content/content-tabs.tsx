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
    <div className="mb-6">
      <nav
        aria-label="Phân loại dữ liệu"
        className="flex gap-7 border-b border-[var(--admin-border)]"
      >
        {(Object.keys(sectionLabel) as ContentSection[]).map((item) => {
          const active = item === section;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`border-b-2 px-1 py-3 text-sm font-bold transition ${adminFocus} ${active ? "border-[var(--admin-brand-red)] text-[var(--admin-ink)]" : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink-soft)]"}`}
              href={href(skill, item)}
              key={item}
            >
              {sectionLabel[item]}
            </Link>
          );
        })}
      </nav>
      <nav
        aria-label="Kỹ năng TOEIC"
        className="mt-5 grid overflow-hidden rounded-2xl border border-[#f1d8ce] bg-[#fff7f2] p-1 sm:grid-cols-3"
      >
        {skills.map((item) => {
          const active = item.id === skill;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${adminFocus} ${active ? "admin-brand-gradient-fill text-white shadow-[0_8px_20px_rgb(236_37_27/22%)]" : "text-[var(--admin-muted)] hover:bg-white hover:text-[var(--admin-ink-soft)]"}`}
              href={href(item.id, section)}
              key={item.id}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"}`}
              >
                {item.parts}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
