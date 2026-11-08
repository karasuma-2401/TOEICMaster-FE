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
    <div className="rounded-2xl border border-(--sp-hero-line) bg-(--sp-cream) p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-(--sp-brand)">
          Câu hỏi {index + 1}/{total}
        </p>
        {question && <SpeakAloudButton text={question} />}
      </div>
      <p
        className="mt-2 max-w-prose text-lg font-semibold leading-8 text-(--sp-ink)"
        lang="en"
      >
        {question ?? "Câu hỏi sẽ hiện khi đến lượt."}
      </p>
    </div>
  );
}
