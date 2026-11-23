import type {
  WritingAttemptQuestionApi,
  WritingEvaluationApi,
} from "@/features/writing/attempt-api";
import { WritingQuestionPrompt } from "./writing-question-prompt";

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "amber";
}) {
  return (
    <div
      className={`rounded-2xl p-5 ring-1 ${tone === "green" ? "bg-emerald-50 ring-emerald-100" : "bg-amber-50 ring-amber-100"}`}
    >
      <h2 className="font-bold">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
        {items.length > 0 ? (
          items.map((item) => <li key={item}>{item}</li>)
        ) : (
          <li>No feedback yet.</li>
        )}
      </ul>
    </div>
  );
}

export function WritingEvaluationReport({
  evaluation,
  practicePart,
  questions,
  partial = false,
}: {
  evaluation: WritingEvaluationApi;
  practicePart?: 1 | 2 | 3;
  questions: WritingAttemptQuestionApi[];
  partial?: boolean;
}) {
  const useRawScore =
    Boolean(practicePart) || partial || evaluation.estimatedScore === null;
  const rawScore =
    evaluation.rawScore ??
    evaluation.feedback.reduce((sum, item) => sum + item.criterionScore, 0);
  const maximumScore =
    evaluation.maxRawScore ??
    questions.reduce(
      (sum, item) => sum + (item.part === 1 ? 3 : item.part === 2 ? 4 : 5),
      0,
    );
  const parts = ([1, 2, 3] as const).flatMap((part) => {
    const partQuestions = questions.filter(
      (question) => question.part === part,
    );
    const scores = partQuestions.map(
      (question) =>
        evaluation.feedback.find(
          (item) => item.questionPosition === question.position,
        )?.criterionScore,
    );
    if (!scores.length || scores.some((score) => score == null)) return [];
    return [
      {
        part,
        count: scores.length,
        score: scores.reduce<number>((sum, score) => sum + (score ?? 0), 0),
        maximum: scores.length * (part === 1 ? 3 : part === 2 ? 4 : 5),
      },
    ];
  });
  return (
    <section className="mt-7 space-y-5">
      <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-6 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-wide">
          {useRawScore
            ? "AI rubric exercise score"
            : "AI-estimated TOEIC Writing score"}
        </p>
        <p className="mt-2 text-5xl font-black text-orange-700">
          {useRawScore ? rawScore : evaluation.estimatedScore}
          <span className="text-2xl">/{useRawScore ? maximumScore : 200}</span>
        </p>
        <p className="mt-3 text-sm text-slate-600">
          AI scores are for practice only and are not official ETS results.
        </p>
      </div>
      {!practicePart && parts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {parts.map(({ part, count, score, maximum }) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5"
              key={part}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                {count} {count === 1 ? "question" : "questions"} · Writing Part{" "}
                {part}
              </p>
              <p className="mt-3 text-2xl font-bold text-orange-700">
                {score}{" "}
                <span className="text-base text-slate-500">/ {maximum}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Total AI rubric score
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold">Overall feedback</h2>
        <p className="mt-2 leading-7 text-slate-700">{evaluation.summary}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FeedbackList
          items={evaluation.strengths}
          title="Strengths"
          tone="green"
        />
        <FeedbackList
          items={evaluation.improvements}
          title="Areas for improvement"
          tone="amber"
        />
      </div>
      {evaluation.feedback.length > 0 && (
        <div className="rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold">Question-by-question feedback</h2>
          <div className="mt-4 space-y-4">
            {evaluation.feedback.map((item) => (
              <article
                className="rounded-xl bg-stone-50 p-4"
                key={item.questionPosition}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">
                    Question {item.questionPosition}
                  </h3>
                  <p className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    AI rubric score: {item.criterionScore}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {item.feedback}
                </p>
                <p className="mt-2 text-sm leading-6 text-orange-800">
                  <span className="font-bold">Suggested revision: </span>
                  {item.suggestedRevision}
                </p>
                {questions
                  .filter(
                    (question) => question.position === item.questionPosition,
                  )
                  .map((question) => (
                    <details
                      className="mt-4 rounded-xl bg-white p-4"
                      key={question.position}
                    >
                      <summary className="cursor-pointer font-semibold">
                        View prompt and submitted answer
                      </summary>
                      <div className="mt-4">
                        <WritingQuestionPrompt question={question} />
                      </div>
                      <h4 className="mt-4 font-semibold">Submitted answer</h4>
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {question.answer || "No answer provided."}
                      </p>
                    </details>
                  ))}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
