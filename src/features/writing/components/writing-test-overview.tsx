import Link from "next/link";
import type { WritingTestSummary } from "@/features/writing/types";
import { WritingHeader } from "./writing-header";

function formatDuration(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} phút`;
}

interface WritingTestOverviewProps {
  mode: string | undefined;
  test: WritingTestSummary;
}

export function WritingTestOverview({ mode, test }: WritingTestOverviewProps) {
  const selectedPart = test.parts.find((part) => mode === `part-${part.part}`);
  const isPartPractice = selectedPart !== undefined;
  const title = isPartPractice ? "Luyện theo Part" : "Full Writing Test";
  const visibleParts = selectedPart ? [selectedPart] : test.parts;
  const questionCount = visibleParts.reduce(
    (total, part) => total + part.questionCount,
    0,
  );
  const totalSeconds = visibleParts.reduce(
    (total, part) =>
      total +
      part.questionCount * (part.preparationSeconds + part.responseSeconds),
    0,
  );

  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:py-14">
        <Link
          className="text-sm font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-orange-600"
          href="/writing"
        >
          ← Quay lại thư viện Writing
        </Link>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
            {title.toUpperCase()}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {test.title}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {test.description}
          </p>

          <dl className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs font-semibold text-slate-500">Cấu trúc</dt>
              <dd className="mt-1 text-lg font-bold">{questionCount} câu</dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs font-semibold text-slate-500">
                Thời lượng
              </dt>
              <dd className="mt-1 text-lg font-bold">
                {formatDuration(totalSeconds)}
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs font-semibold text-slate-500">Độ khó</dt>
              <dd className="mt-1 text-lg font-bold">{test.difficulty}</dd>
            </div>
          </dl>

          <section className="mt-8" aria-labelledby="test-rules">
            <h2 className="font-bold" id="test-rules">
              Quy tắc làm bài
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>Mỗi câu có pha chuẩn bị và pha làm bài riêng.</li>
              <li>Hết thời gian hoặc bấm Next, câu hiện tại sẽ bị khóa.</li>
              <li>Bài được autosave trong khi làm và tự nộp sau câu cuối.</li>
            </ul>
          </section>

          <section className="mt-8" aria-labelledby="test-structure">
            <h2 className="font-bold" id="test-structure">
              Cấu trúc đề
            </h2>
            <ol className="mt-4 space-y-3">
              {visibleParts.map((part) => (
                <li
                  className="flex gap-4 rounded-xl border border-slate-200 p-4"
                  key={part.part}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-50 text-sm font-bold text-orange-700">
                    {part.part}
                  </span>
                  <div>
                    <h3 className="font-semibold">{part.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {part.questionCount} câu · Chuẩn bị{" "}
                      {part.preparationSeconds}s · Làm bài{" "}
                      {formatDuration(part.responseSeconds)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <Link
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 text-sm font-bold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
            href={`/writing/attempts/mock-${test.id}?mode=${encodeURIComponent(mode ?? "full")}`}
          >
            Bắt đầu làm bài
          </Link>
        </div>
      </main>
    </div>
  );
}
