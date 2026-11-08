import type { ReadAloudContent } from "@/features/speaking/types";

export function ReadAloudPrompt({ content }: { content: ReadAloudContent }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-inner shadow-slate-100">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        Read the text aloud
      </p>
      <p
        className="mt-3 max-w-prose text-lg leading-9 text-slate-800 sm:text-xl sm:leading-10"
        lang="en"
      >
        {content.passage}
      </p>
    </article>
  );
}
