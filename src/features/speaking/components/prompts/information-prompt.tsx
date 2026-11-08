import type { InformationContent } from "@/features/speaking/types";
import { QuestionCallout } from "./question-callout";

export function InformationPrompt({
  content,
  questionIndex,
  revealQuestion,
  showAllQuestions,
}: {
  content: InformationContent;
  questionIndex: number;
  revealQuestion: boolean;
  showAllQuestions: boolean;
}) {
  const visible = showAllQuestions
    ? content.questions.map((question, index) => ({ question, index }))
    : revealQuestion
      ? [{ question: content.questions[questionIndex], index: questionIndex }]
      : [];
  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-2xl border border-(--sp-line) bg-white">
        <h3
          className="border-b border-(--sp-line) bg-(--sp-ink) px-5 py-3 text-sm font-bold text-white"
          lang="en"
        >
          {content.documentTitle}
        </h3>
        <table className="w-full text-left text-sm">
          <tbody>
            {content.documentRows.map((row) => (
              <tr
                className="border-t border-(--sp-line) first:border-0 even:bg-(--sp-subtle)"
                key={`${row.label}-${row.value}`}
              >
                <th
                  className="w-36 px-5 py-2.5 align-top font-semibold text-(--sp-ink-3)"
                  scope="row"
                >
                  {row.label}
                </th>
                <td className="px-5 py-2.5 text-(--sp-ink)">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
      <p
        className="rounded-2xl border border-(--sp-line) bg-(--sp-subtle) p-5 text-sm italic leading-6 text-(--sp-ink-2)"
        lang="en"
      >
        “{content.callerIntro}”
      </p>
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-(--sp-warning-line) bg-(--sp-warning-bg) p-4 text-sm font-semibold text-(--sp-warning)">
          Đọc kỹ bảng thông tin. Câu hỏi sẽ hiện khi hết thời gian đọc.
        </p>
      ) : (
        visible.map(({ question, index }) => (
          <QuestionCallout
            index={index}
            key={index}
            question={question}
            total={content.questions.length}
          />
        ))
      )}
    </div>
  );
}
