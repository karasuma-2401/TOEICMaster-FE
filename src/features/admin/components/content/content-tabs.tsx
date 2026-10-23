import Link from "next/link";
import { adminFocus } from "./admin-styles";

export type ContentSkill = "writing" | "speaking";
export type ContentSection = "content" | "tests";

const skills: { id: ContentSkill; label: string }[] = [
  { id: "writing", label: "Writing" },
  { id: "speaking", label: "Speaking" },
];

const sectionLabel: Record<ContentSkill, Record<ContentSection, string>> = {
  writing: { content: "Bài tập", tests: "Đề Writing" },
  speaking: { content: "Bài tập", tests: "Đề Speaking" },
};

function href(skill: ContentSkill, section: ContentSection) {
  return section === "content"
    ? `/admin/content/${skill}`
    : `/admin/tests/${skill}`;
}

/** Skill switch plus exercise/test tabs shared by the admin content pages. */
export function ContentTabs({
  skill,
  section,
}: {
  skill: ContentSkill;
  section: ContentSection;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--admin-border)]">
      <nav
        aria-label={`Kho dữ liệu ${skill === "writing" ? "Writing" : "Speaking"}`}
        className="flex gap-5"
      >
        {(["content", "tests"] as const).map((id) => (
          <Link
            aria-current={id === section ? "page" : undefined}
            className={`border-b-2 px-1 py-3 text-sm font-bold ${adminFocus} ${id === section ? "border-[var(--admin-brand-red)] text-[var(--admin-brand-red)]" : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"}`}
            href={href(skill, id)}
            key={id}
          >
            {sectionLabel[skill][id]}
          </Link>
        ))}
      </nav>
      <nav
        aria-label="Kỹ năng"
        className="mb-2 flex rounded-lg bg-[var(--admin-surface-muted)] p-1"
      >
        {skills.map((item) => (
          <Link
            aria-current={item.id === skill ? "true" : undefined}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${adminFocus} ${item.id === skill ? "bg-white text-[var(--admin-brand-red)] shadow-sm" : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"}`}
            href={href(item.id, section)}
            key={item.id}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
