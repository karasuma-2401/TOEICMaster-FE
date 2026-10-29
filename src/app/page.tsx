import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionFromCookieStore } from "@/features/auth/server/session";
import { ConnectionStatus } from "@/features/system/components/connection-status";
import { UserMenu } from "@/features/user/components/user-menu";

const areas = [
  ["Học theo chủ đề", "Củng cố từ vựng, ngữ pháp và kỹ năng nghe hiểu."],
  ["Luyện tập từng phần", "Luyện tập theo cấu trúc 7 phần của bài thi TOEIC."],
  ["Thi thử", "Làm bài theo thời gian và theo dõi kết quả."],
];

export default async function Home(props: {
  searchParams?: Promise<{ profile?: string }>;
}) {
  const session = sessionFromCookieStore(await cookies());
  if (session?.role === "ADMIN") redirect("/admin/exams");

  const searchParams = await props.searchParams;
  const openProfile = searchParams?.profile === "1";

  return (
    <div className="min-h-screen bg-[var(--admin-page)]">
      <header className="border-b border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-xl font-bold tracking-tight text-[var(--admin-brand-red)]">
            TOEICMaster
          </span>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[var(--admin-avatar-border)] bg-[var(--admin-role-admin-soft)] px-3 py-1 text-sm text-[var(--admin-role-admin)]">
              Đang phát triển
            </span>
            <UserMenu initialOpen={openProfile} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold tracking-wide text-[var(--admin-brand-red)]">
          HỌC VÀ LUYỆN THI TOEIC
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight font-bold text-[var(--admin-ink)] sm:text-5xl">
          Từng bước tiến tới mục tiêu TOEIC của bạn.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--admin-ink-soft)]">
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
              className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[0_8px_22px_rgb(82_53_39_/_6%)]"
            >
              <h2 className="text-lg font-semibold text-[var(--admin-ink)]">
                {title}
              </h2>
              <p className="mt-3 leading-7 text-[var(--admin-ink-soft)]">
                {description}
              </p>
              <p className="mt-5 text-sm text-[var(--admin-muted)]">
                Sắp triển khai
              </p>
            </article>
          ))}
        </section>
        <ConnectionStatus />
      </main>
    </div>
  );
}
