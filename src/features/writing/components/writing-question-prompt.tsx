import type { WritingAttemptQuestionApi } from "@/features/writing/attempt-api";

function containsKeyword(value: string, keyword: string | null) {
  if (!keyword) return false;
  return value
    .toLocaleLowerCase("en-US")
    .includes(keyword.toLocaleLowerCase("en-US"));
}

function PictureSentencePrompt({
  question,
}: {
  question: WritingAttemptQuestionApi;
}) {
  return (
    <>
      {question.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote media is proxied through the application.
        <img
          alt={question.imageAlt ?? "Ảnh đề bài"}
          className="h-64 w-full rounded-2xl object-cover ring-1 ring-slate-200"
          src={question.imageUrl.replace(/^\/api\/v1\/writing/, "/api/writing")}
        />
      ) : (
        <div
          aria-label={question.imageAlt ?? "Ảnh đề bài"}
          className="grid h-64 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 via-amber-50 to-stone-100 p-6 text-center text-sm font-semibold text-orange-900 ring-1 ring-orange-100"
        >
          <div>
            <span className="block text-xs font-bold tracking-[0.12em] text-orange-600">
              HÌNH ẢNH ĐỀ BÀI
            </span>
            <span className="mt-2 block">
              {question.imageAlt ?? "Ảnh minh họa Part 1"}
            </span>
          </div>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Từ bắt buộc
        </span>
        {[question.keywordOne, question.keywordTwo]
          .filter((keyword): keyword is string => Boolean(keyword))
          .map((keyword) => (
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${containsKeyword(question.answer, keyword) ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-orange-50 text-orange-800 ring-orange-200"}`}
              key={keyword}
            >
              {containsKeyword(question.answer, keyword) && (
                <span aria-hidden="true">✓ </span>
              )}
              {keyword}
            </span>
          ))}
      </div>
    </>
  );
}

function EmailPrompt({ question }: { question: WritingAttemptQuestionApi }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm leading-6">
      <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <dt className="font-bold text-slate-500">From:</dt>
        <dd>{question.sender}</dd>
        <dt className="font-bold text-slate-500">To:</dt>
        <dd>{question.recipient}</dd>
        <dt className="font-bold text-slate-500">Subject:</dt>
        <dd className="font-semibold">{question.subject}</dd>
      </dl>
      <p className="max-w-prose whitespace-pre-line px-5 py-5">
        {question.emailBody}
      </p>
      <p className="mx-5 mb-5 rounded-xl bg-orange-50 p-3 font-semibold text-orange-900 ring-1 ring-orange-100">
        Yêu cầu: {question.directions}
      </p>
    </article>
  );
}

function EssayPrompt({ question }: { question: WritingAttemptQuestionApi }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <h2 className="max-w-prose text-lg font-bold leading-7">
        {question.prompt}
      </h2>
      <p className="mt-4 max-w-prose whitespace-pre-line text-sm leading-6 text-slate-600">
        {question.outline}
      </p>
      <p className="mt-4 inline-flex rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-800 ring-1 ring-orange-100">
        Tối thiểu {question.minimumWordCount} từ
      </p>
    </article>
  );
}

export function WritingQuestionPrompt({
  question,
}: {
  question: WritingAttemptQuestionApi;
}) {
  if (question.part === 1) return <PictureSentencePrompt question={question} />;
  if (question.part === 2) return <EmailPrompt question={question} />;
  return <EssayPrompt question={question} />;
}
