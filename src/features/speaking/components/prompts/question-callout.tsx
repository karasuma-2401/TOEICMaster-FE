import { SpeakAloudButton } from "./speak-aloud-button";

/** The question currently asked in Part 3/4, with a browser read-aloud option. */
export function QuestionCallout({
  index,
  total,
  question,
}: {
  index: number;
  total: number;
  question: string | null;
}) {
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-700">
          Câu hỏi {index + 1}/{total}
        </p>
        {question && <SpeakAloudButton text={question} />}
      </div>
      <p
        className="mt-2 max-w-prose text-lg font-semibold leading-8 text-slate-900"
        lang="en"
      >
        {question ?? "Câu hỏi sẽ hiện khi đến lượt."}
      </p>
    </div>
  );
}
