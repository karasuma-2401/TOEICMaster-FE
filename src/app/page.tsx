import { ConnectionStatus } from "@/features/system/components/connection-status";
import { AccountControls } from "@/features/auth/components/account-controls";

const areas = [
  ["Học theo chủ đề", "Củng cố từ vựng, ngữ pháp và kỹ năng nghe hiểu."],
  ["Luyện tập từng phần", "Luyện tập theo cấu trúc 7 phần của bài thi TOEIC."],
  ["Thi thử", "Làm bài theo thời gian và theo dõi kết quả."],
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-xl font-bold tracking-tight text-blue-700">
            TOEICMaster
          </span>
          <AccountControls />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold text-blue-700">
          HỌC VÀ LUYỆN THI TOEIC
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight font-bold sm:text-5xl">
          Từng bước tiến tới mục tiêu TOEIC của bạn.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Nền tảng đang được xây dựng. Các tính năng học tập và thi thử sẽ được
          bổ sung trong những phiên bản tiếp theo.
        </p>
        <section
          aria-label="Các tính năng dự kiến"
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {areas.map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
              <p className="mt-5 text-sm text-slate-500">Sắp triển khai</p>
            </article>
          ))}
        </section>
        <ConnectionStatus />
      </main>
    </div>
  );
}
