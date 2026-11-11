import Link from "next/link";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import { AdminPageHeader } from "./admin-page-header";
import { adminFocus } from "./admin-styles";
import { ContentTabs } from "./content-tabs";

type PartCard = {
  part: number;
  title: string;
  subtitle: string;
  type: string;
};

const writingParts: readonly PartCard[] = [
  {
    part: 1,
    title: "Write a sentence",
    subtitle: "Viết câu theo tranh",
    type: "Hình ảnh + Từ gợi ý",
  },
  {
    part: 2,
    title: "Respond to a written request",
    subtitle: "Phản hồi yêu cầu viết",
    type: "Email",
  },
  {
    part: 3,
    title: "Write an opinion",
    subtitle: "Viết bài nêu quan điểm",
    type: "Đoạn văn",
  },
];

const speakingParts: readonly PartCard[] = [1, 2, 3, 4, 5].map((part) => {
  const spec = speakingPartSpecs[part as keyof typeof speakingPartSpecs];
  return {
    part,
    title: spec.title,
    subtitle: spec.subtitle,
    type:
      part === 1
        ? "Văn bản + Audio"
        : part === 2
          ? "Hình ảnh + Audio"
          : part === 5
            ? "Câu hỏi + Audio"
            : "Cụm câu hỏi + Audio",
  };
});

const pageCopy = {
  speaking: {
    title: "Ngân hàng bài tập Speaking",
    description: "Chọn một Part để quản lý bài tập trong workspace riêng.",
    label: "Speaking",
    parts: speakingParts,
  },
  writing: {
    title: "Ngân hàng bài tập Writing",
    description: "Chọn một Part để quản lý bài tập trong workspace riêng.",
    label: "Writing",
    parts: writingParts,
  },
} as const;

export function AdminPartLanding({ skill }: { skill: "speaking" | "writing" }) {
  const config = pageCopy[skill];

  return (
    <div>
      <AdminPageHeader description={config.description} title={config.title} />
      <ContentTabs section="content" skill={skill} />
      <section aria-labelledby={`${skill}-part-heading`}>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2
              className="text-lg font-bold text-[var(--admin-ink)]"
              id={`${skill}-part-heading`}
            >
              {config.label}
            </h2>
            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              Chọn Part để xem, thêm thủ công hoặc import ngân hàng bài tập.
            </p>
          </div>
          <span className="text-xs font-bold text-[var(--admin-muted)]">
            {config.parts.length} Parts
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {config.parts.map((part) => (
            <Link
              aria-label={`${config.label} Part ${part.part} · ${part.title}`}
              className={`group min-h-36 rounded-2xl border border-[#ffc5b0] border-t-4 border-t-[var(--admin-brand-orange)] bg-[linear-gradient(135deg,#fff9f6,#fff)] p-4 text-left shadow-[0_7px_18px_rgb(255_108_13/5%)] transition hover:-translate-y-0.5 hover:border-[var(--admin-brand-orange)] hover:shadow-[0_16px_32px_rgb(255_108_13/16%)] ${adminFocus}`}
              href={`/admin/content/${skill}/part-${part.part}`}
              key={part.part}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[var(--admin-ink)]">
                    Part {part.part}: {part.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {part.subtitle}
                  </p>
                </div>
                <span className="text-xs font-bold text-[var(--admin-brand-orange)]">
                  — câu
                </span>
              </div>
              <span className="mt-5 inline-flex rounded-md bg-[#fff0e8] px-2 py-1 text-[11px] font-bold text-[var(--admin-brand-orange)]">
                {part.type}
              </span>
              <span className="mt-4 flex items-center justify-between border-t border-[#ffd8cb] pt-3 text-xs font-bold text-[var(--admin-brand-orange)]">
                Xem bài tập <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
