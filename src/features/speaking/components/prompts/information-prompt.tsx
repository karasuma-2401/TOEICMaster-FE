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
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h3
          className="border-b border-slate-100 bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          lang="en"
        >
          {content.documentTitle}
        </h3>
        <table className="w-full text-left text-sm">
          <tbody>
            {content.documentRows.map((row) => (
              <tr
                className="border-t border-slate-100 first:border-0 even:bg-slate-50/70"
                key={`${row.label}-${row.value}`}
              >
                <th
                  className="w-36 px-5 py-2.5 align-top font-semibold text-slate-500"
                  scope="row"
                >
                  {row.label}
                </th>
                <td className="px-5 py-2.5 text-slate-800">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
      <p
        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm italic leading-6 text-slate-600"
        lang="en"
      >
        “{content.callerIntro}”
      </p>
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
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
