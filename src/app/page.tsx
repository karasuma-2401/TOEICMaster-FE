import Link from "next/link";
import {
  ArrowRightIcon,
  ClockIcon,
  HeadphonesIcon,
  MicIcon,
  PencilIcon,
} from "@/features/speaking/components/ui/icons";
import { SpeakingLogo } from "@/features/speaking/components/ui/primitives";
import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";
import { ConnectionStatus } from "@/features/system/components/connection-status";
import { UserMenu } from "@/features/user/components/user-menu";
import { GuideMascot } from "@/shared/components/mascot/guide-mascot";

const navigation = [
  { label: "Speaking", href: "/speaking" },
  { label: "Writing", href: "/writing" },
  { label: "Lịch sử", href: "/history/writing" },
];

const skills = [
  {
    name: "Listening & Reading",
    href: null,
    action: "Sắp ra mắt",
    Icon: HeadphonesIcon,
    color: "text-(--sp-lr) bg-(--sp-lr-bg) border-(--sp-lr)",
    facts: ["200 câu", "120 phút", "Thang 10–990"],
    description:
      "Làm đề Nghe & Đọc 7 Part với Master Audio liên tục và bảng theo dõi 200 câu.",
  },
  {
    name: "Speaking",
    href: "/speaking",
    action: "Vào luyện Speaking",
    Icon: MicIcon,
    color: "text-(--sp-speak) bg-(--sp-speak-bg) border-(--sp-speak-line)",
    facts: ["11 câu", "~20 phút", "Thang 0–200"],
    description:
      "Thu âm theo đúng nhịp phòng thi với pha chuẩn bị và trả lời, rồi nhận đánh giá AI cho từng câu.",
  },
  {
    name: "Writing",
    href: "/writing",
    action: "Vào luyện Writing",
    Icon: PencilIcon,
    color: "text-(--sp-write) bg-(--sp-write-bg) border-(--sp-write)",
    facts: ["8 câu", "60 phút", "Thang 0–200"],
    description:
      "Viết câu theo tranh, phản hồi email và viết luận, luyện từng Part hoặc làm full test có tính giờ.",
  },
];

const steps = [
  ["01", "Luyện từng Part", "Nắm chắc từng dạng câu hỏi trước khi làm đề."],
  ["02", "Thi thử có tính giờ", "Làm full test trong điều kiện như thi thật."],
  ["03", "Xem lại và cải thiện", "Đọc nhận xét, sửa điểm yếu rồi làm lại."],
];

export default async function Home(props: {
  searchParams?: Promise<{ profile?: string }>;
}) {
  const searchParams = await props.searchParams;
  const openProfile = searchParams?.profile === "1";

  return (
    <div className={`sp-theme sp-page ${speakingFontClasses}`}>
      <header className="sticky top-0 z-30 border-b border-(--sp-line) bg-(--sp-surface)">
        <div className="sp-container flex min-h-16 flex-wrap items-center gap-x-10 gap-y-2 py-2">
          <SpeakingLogo />
          <nav aria-label="Kỹ năng" className="flex gap-7 text-[15px]">
            {navigation.map((item) => (
              <Link
                className="sp-focus font-medium hover:text-(--sp-brand)"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <UserMenu initialOpen={openProfile} />
          </div>
        </div>
      </header>

      <main className="sp-container pb-12 pt-8">
        <section className="relative overflow-hidden rounded-[20px] bg-(--sp-ink) p-8 text-white md:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 size-96 rounded-full bg-(--sp-brand) opacity-30 blur-3xl"
          />
          <div className="relative max-w-3xl">
            <p className="sp-overline text-(--sp-amber)">
              LUYỆN THI TOEIC ĐỦ KỸ NĂNG
            </p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.12] tracking-[-0.01em] md:text-[56px]">
              Từng bước tiến tới mục tiêu TOEIC của bạn.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/70">
              Luyện đúng định dạng đề thi, làm bài có tính giờ và biết chính xác
              mình cần cải thiện điều gì.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="sp-btn sp-btn-cta sp-btn-lg" href="/speaking">
                Thi thử Speaking <ArrowRightIcon size={18} />
              </Link>
              <Link
                className="sp-btn sp-btn-lg border-white/30! text-white hover:bg-white/10"
                href="/writing"
              >
                Luyện Writing
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="home-skills" className="mt-10">
          <h2 className="text-2xl font-bold" id="home-skills">
            Chọn kỹ năng để bắt đầu
          </h2>
          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            {skills.map(({ Icon, ...skill }) => {
              const body = (
                <>
                  <span
                    className={`grid size-14 place-items-center rounded-2xl border ${skill.color}`}
                  >
                    <Icon size={26} />
                  </span>
                  <span className="mt-4 text-2xl font-bold leading-8">
                    {skill.name}
                  </span>
                  <span className="mt-2 flex-1 leading-7 text-(--sp-ink-2)">
                    {skill.description}
                  </span>
                  <span className="mt-4 flex flex-wrap gap-2">
                    {skill.facts.map((fact) => (
                      <span className="sp-chip sp-chip-neutral" key={fact}>
                        {fact}
                      </span>
                    ))}
                  </span>
                </>
              );
              return skill.href ? (
                <Link
                  className="sp-card sp-focus group flex flex-col p-7 transition hover:-translate-y-0.5 hover:border-(--sp-brand)"
                  href={skill.href}
                  key={skill.name}
                >
                  {body}
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-(--sp-brand)">
                    {skill.action}
                    <ArrowRightIcon
                      className="transition group-hover:translate-x-1"
                      size={18}
                    />
                  </span>
                </Link>
              ) : (
                <article className="sp-card flex flex-col p-7" key={skill.name}>
                  {body}
                  <span className="mt-6 font-semibold text-(--sp-ink-3)">
                    {skill.action}
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="home-steps" className="mt-10">
          <h2 className="text-2xl font-bold" id="home-steps">
            Lộ trình luyện thi
          </h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <li className="sp-card p-5" key={number}>
                <span className="text-[13px] font-bold text-(--sp-brand)">
                  {number}
                </span>
                <p className="mt-1 text-lg font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-(--sp-ink-2)">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Link
            className="sp-card sp-focus flex items-center gap-4 p-5 transition hover:border-(--sp-brand)"
            href="/history/writing"
          >
            <ClockIcon className="text-(--sp-brand)" size={24} />
            <span>
              <span className="block font-semibold">Lịch sử học tập</span>
              <span className="text-[13px] text-(--sp-ink-2)">
                Theo dõi các lượt làm Writing và kết quả khi đã đăng nhập.
              </span>
            </span>
          </Link>
          <Link
            className="sp-card sp-focus flex items-center gap-4 p-5 transition hover:border-(--sp-brand)"
            href="/admin/content/writing"
          >
            <PencilIcon className="text-(--sp-brand)" size={24} />
            <span>
              <span className="block font-semibold">Khu vực quản trị</span>
              <span className="text-[13px] text-(--sp-ink-2)">
                Quản lý dữ liệu và đề Writing, Speaking.
              </span>
            </span>
          </Link>
        </section>
        <ConnectionStatus />
      </main>
      <GuideMascot />
    </div>
  );
}
