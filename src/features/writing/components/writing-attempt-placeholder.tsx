import Link from "next/link";
import { WritingHeader } from "./writing-header";

interface WritingAttemptPlaceholderProps {
  attemptId: string;
}

export function WritingAttemptPlaceholder({
  attemptId,
}: WritingAttemptPlaceholderProps) {
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:py-14">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
            WRITING WORKSPACE
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Sẵn sàng cho luồng làm bài
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Route workspace đã sẵn sàng cho CP1. Editor, timer từng câu,
            autosave và submit thật sẽ được xây ở CP3.
          </p>
          <dl className="mt-7 rounded-xl bg-stone-50 p-4 text-sm">
            <dt className="font-semibold text-slate-500">Attempt mock</dt>
            <dd className="mt-1 font-mono text-slate-800">{attemptId}</dd>
          </dl>
          <Link
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
            href="/writing"
          >
            Quay lại thư viện
          </Link>
        </section>
      </main>
    </div>
  );
}
