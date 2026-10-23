import Link from "next/link";
import {
  totalWritingQuestions,
  totalWritingSeconds,
  writingContentSummaries,
  writingTests,
} from "@/features/writing/mock-data";

function formatDuration(seconds: number) {
  return `${Math.ceil(seconds / 60)} phút`;
}

function WritingAdminTabs({ active }: { active: "content" | "tests" }) {
  const tabs = [
    { href: "/admin/content/writing", label: "Bài tập", id: "content" },
    { href: "/admin/tests/writing", label: "Đề Writing", id: "tests" },
  ] as const;

  return (
    <nav
      aria-label="Kho dữ liệu Writing"
      className="flex gap-5 border-b border-[var(--admin-border)]"
    >
      {tabs.map((tab) => {
        const current = tab.id === active;
        return (
          <Link
            aria-current={current ? "page" : undefined}
            className={`border-b-2 px-1 py-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)] ${
              current
                ? "border-[var(--admin-brand-red)] text-[var(--admin-brand-red)]"
                : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
            }`}
            href={tab.href}
            key={tab.id}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminWritingContentPage() {
  const totalExercises = writingContentSummaries.reduce(
    (total, part) => total + part.exerciseCount,
    0,
  );

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
          QUẢN TRỊ / KHO DỮ LIỆU
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-3xl">
          Kho dữ liệu Writing
        </h1>
        <p className="mt-1.5 text-sm text-[var(--admin-muted)]">
          Khung dữ liệu mock cho CP1. Tạo, sửa và import sẽ được triển khai ở
          CP2.
        </p>
      </div>

      <WritingAdminTabs active="content" />

      <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-[var(--admin-ink-soft)]">
        <strong className="text-[var(--admin-brand-red)]">
          CP1 / Mock data
        </strong>
        <span className="ml-2">
          Các số liệu bên dưới là dữ liệu mô phỏng để kiểm tra luồng điều hướng.
        </span>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-[15rem_1fr]">
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-sm text-[var(--admin-muted)]">Tổng số bài tập</p>
          <p className="mt-2 text-3xl font-bold text-[var(--admin-brand-red)]">
            {totalExercises}
          </p>
          <p className="mt-3 text-xs leading-5 text-[var(--admin-muted)]">
            3 nhóm bài Writing đang được mô phỏng trong CP1.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {writingContentSummaries.map((part) => (
            <article
              className="rounded-2xl border border-[var(--admin-border)] border-t-4 border-t-orange-400 bg-[var(--admin-surface)] p-5"
              key={part.part}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[0.1em] text-[var(--admin-brand-red)]">
                    WRITING PART {part.part}
                  </p>
                  <h2 className="mt-2 font-bold text-[var(--admin-ink)]">
                    {part.subtitle}
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--admin-nav-active)] px-2 py-1 text-xs font-bold text-[var(--admin-brand-red)]">
                  {part.exerciseCount}
                </span>
              </div>
              <p className="mt-3 min-h-16 text-sm leading-6 text-[var(--admin-muted)]">
                {part.description}
              </p>
              <button
                className="mt-5 text-sm font-bold text-[var(--admin-brand-red)] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
                disabled
                title="Quản lý bài tập sẽ có ở CP2"
                type="button"
              >
                Quản lý bài tập
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminWritingTestsPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
            QUẢN TRỊ / KHO DỮ LIỆU
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-3xl">
            Đề Writing
          </h1>
          <p className="mt-1.5 text-sm text-[var(--admin-muted)]">
            Danh sách đề mock để kiểm tra navigation và trạng thái bảng.
          </p>
        </div>
        <button
          className="h-11 rounded-lg px-4 text-sm font-bold text-white opacity-70 shadow-[var(--admin-action-shadow)]"
          disabled
          style={{ background: "var(--admin-brand-gradient)" }}
          title="Tạo đề sẽ có ở CP2"
          type="button"
        >
          + Tạo đề Writing
        </button>
      </div>

      <WritingAdminTabs active="tests" />

      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--admin-surface-muted)] text-xs font-bold tracking-wide text-[var(--admin-muted)]">
              <tr>
                <th className="px-5 py-4">MÃ ĐỀ</th>
                <th className="px-5 py-4">TÊN ĐỀ</th>
                <th className="px-5 py-4">CẤU TRÚC</th>
                <th className="px-5 py-4">THỜI LƯỢNG</th>
                <th className="px-5 py-4">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {writingTests.map((test) => (
                <tr
                  className="border-t border-[var(--admin-border)] hover:bg-[var(--admin-row-hover)]"
                  key={test.id}
                >
                  <td className="px-5 py-4 font-bold text-[var(--admin-brand-red)]">
                    {test.code}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--admin-ink)]">
                      {test.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">
                      {test.difficulty}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-[var(--admin-ink-soft)]">
                    {totalWritingQuestions(test)} câu · 3 Part
                  </td>
                  <td className="px-5 py-4 text-[var(--admin-ink-soft)]">
                    {formatDuration(totalWritingSeconds(test))}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[var(--admin-success-soft)] px-2.5 py-1 text-xs font-bold text-[var(--admin-success)]">
                      Công bố
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
