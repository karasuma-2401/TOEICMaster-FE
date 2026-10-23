import Link from "next/link";
import { WritingHeader } from "./writing-header";

export function WritingHistoryPlaceholder() {
  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      <WritingHeader />
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:py-14">
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-xs font-extrabold tracking-[0.14em] text-orange-600">
            LỊCH SỬ WRITING
          </p>
          <h1 className="mt-3 text-2xl font-bold">Chưa có lượt làm bài</h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">
            Sau khi hoàn thành đề Writing, các lượt làm và kết quả sẽ xuất hiện
            ở đây. Lịch sử thật sẽ được kết nối tại CP5.
          </p>
          <Link
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 text-sm font-bold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
            href="/writing"
          >
            Khám phá đề Writing
          </Link>
        </section>
      </main>
    </div>
  );
}
