import type { RespondQuestionsContent } from "@/features/speaking/types";
import { QuestionCallout } from "./question-callout";

export function RespondQuestionsPrompt({
  content,
  questionIndex,
  showAllQuestions,
}: {
  content: RespondQuestionsContent;
  questionIndex: number;
  showAllQuestions: boolean;
}) {
  const visible = showAllQuestions
    ? content.questions.map((question, index) => ({ question, index }))
    : [{ question: content.questions[questionIndex], index: questionIndex }];
  return (
    <div className="space-y-4">
      <p
        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 leading-7 text-slate-700"
        lang="en"
      >
        {content.context}
      </p>
      {visible.map(({ question, index }) => (
        <QuestionCallout
          index={index}
          key={index}
          question={question}
          total={content.questions.length}
        />
      ))}
    </div>
  );
}
