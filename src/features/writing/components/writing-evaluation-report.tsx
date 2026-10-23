import type {
  WritingAttemptApi,
  WritingEvaluationApi,
} from "@/features/writing/attempt-api";

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
          <li>Chưa có nhận xét.</li>
        )}
      </ul>
    </div>
  );
}

export function WritingEvaluationReport({
  evaluation,
  reviewQuestions,
}: {
  evaluation: WritingEvaluationApi;
  reviewQuestions: WritingAttemptApi["reviewQuestions"];
}) {
  return (
    <section className="mt-7 space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white shadow-[0_16px_40px_-20px_rgb(234_88_12/0.8)]">
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10"
        />
        <p className="text-sm font-bold uppercase tracking-wide">
          Điểm TOEIC Writing ước tính bởi AI
        </p>
        <p className="mt-2 text-5xl font-black">
          {evaluation.estimatedScore}
          <span className="text-2xl">/200</span>
        </p>
        <p className="mt-3 text-sm text-orange-50">
          Không phải kết quả ETS chính thức.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold">Nhận xét tổng quan</h2>
        <p className="mt-2 leading-7 text-slate-700">{evaluation.summary}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FeedbackList
          items={evaluation.strengths}
          title="Điểm làm tốt"
          tone="green"
        />
        <FeedbackList
          items={evaluation.improvements}
          title="Cần cải thiện"
          tone="amber"
        />
      </div>
      {evaluation.feedback.length > 0 && (
        <div className="rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold">Gợi ý theo câu</h2>
          <div className="mt-4 space-y-4">
            {evaluation.feedback.map((item) => (
              <article
                className="rounded-xl bg-stone-50 p-4"
                key={item.questionPosition}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">Câu {item.questionPosition}</h3>
                  <p className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    Điểm tiêu chí AI: {item.criterionScore}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {item.feedback}
                </p>
                <p className="mt-2 text-sm leading-6 text-orange-800">
                  <span className="font-bold">Gợi ý ngắn: </span>
                  {item.suggestedRevision}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
      {reviewQuestions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold">Bài mẫu tham khảo</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Đây là một cách triển khai tham khảo, không phải đáp án duy nhất.
          </p>
          <div className="mt-4 space-y-4">
            {reviewQuestions.map((question) => (
              <article
                className="rounded-xl bg-stone-50 p-4"
                key={question.position}
              >
                <h3 className="font-bold">Câu {question.position}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {question.modelAnswer}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
