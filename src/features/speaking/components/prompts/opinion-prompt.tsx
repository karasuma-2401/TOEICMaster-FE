import type { OpinionContent } from "@/features/speaking/types";
import { SpeakAloudButton } from "./speak-aloud-button";

export function OpinionPrompt({ content }: { content: OpinionContent }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Express an opinion
        </p>
        <SpeakAloudButton label="Nghe đề" text={content.prompt} />
      </div>
      <p
        className="mt-3 max-w-prose text-lg font-semibold leading-8 text-slate-900"
        lang="en"
      >
        {content.prompt}
      </p>
      <ol className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
        {["Nêu quan điểm", "Lý do + ví dụ", "Kết luận"].map((item, index) => (
          <li
            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200"
            key={item}
          >
            <span className="grid size-5 place-items-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-700">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </article>
  );
}
