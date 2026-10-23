import Link from "next/link";
import { ConnectionStatus } from "@/features/system/components/connection-status";
import { UserMenu } from "@/features/user/components/user-menu";

const areas = [
  {
    title: "TOEIC Writing",
    description:
      "Luyện từng Part hoặc làm Full Test với thời gian theo từng câu.",
    href: "/writing",
    action: "Khám phá Writing",
  },
  {
    title: "Lịch sử học tập",
    description: "Theo dõi các lượt làm Writing và kết quả khi đã đăng nhập.",
    href: "/history/writing",
    action: "Xem lịch sử",
  },
  {
    title: "Khu vực quản trị",
    description: "Theo dõi dữ liệu và đề Writing trong khu vực quản trị.",
    href: "/admin/content/writing",
    action: "Mở quản trị",
  },
];

export default async function Home(props: {
  searchParams?: Promise<{ profile?: string }>;
}) {
  const searchParams = await props.searchParams;
  const openProfile = searchParams?.profile === "1";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-xl font-bold tracking-tight text-blue-700">
            TOEICMaster
          </span>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              CP1 · Writing foundation
            </span>
            <UserMenu initialOpen={openProfile} />
          </div>
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
          Bắt đầu với kho đề Writing, luyện theo từng Part hoặc mô phỏng full
          test theo thời gian từng câu.
        </p>
        <section
          aria-label="Các tính năng dự kiến"
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {areas.map((area) => (
            <article
              key={area.title}
              className="flex rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">{area.title}</h2>
                <p className="mt-3 leading-7 text-slate-600">
                  {area.description}
                </p>
                <Link
                  className="mt-5 text-sm font-bold text-orange-700 underline decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-orange-600"
                  href={area.href}
                >
                  {area.action}
                </Link>
              </div>
            </article>
          ))}
        </section>
        <ConnectionStatus />
      </main>
    </div>
  );
}
