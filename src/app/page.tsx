import Link from "next/link";
import { FeaturedExams } from "@/features/home/components/featured-exams";
import {
  BookOpenIcon,
  HeadphonesIcon,
  MicIcon,
  PencilIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "@/features/speaking/components/ui/icons";
import { SpeakingLogo } from "@/features/speaking/components/ui/primitives";
import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";
import { ConnectionStatus } from "@/features/system/components/connection-status";
import { UserMenu } from "@/features/user/components/user-menu";
import { GuideMascot } from "@/shared/components/mascot/guide-mascot";
import {
  focusRing,
  primaryAction,
  secondaryAction,
  wideContainer,
} from "@/shared/components/practice/styles";

const navigation = [
  { label: "Listening", href: "/listening" },
  { label: "Reading", href: "/reading" },
  { label: "Speaking", href: "/speaking" },
  { label: "Writing", href: "/writing" },
  { label: "Lịch sử", href: "/history/writing" },
];

const promises = [
  "Đề theo format ETS",
  "AI chấm theo tiêu chí",
  "Bắt đầu miễn phí",
];

const milestoneLinks = navigation.slice(0, 4);

const exams = [
  {
    badge: "L&R",
    name: "Listening & Reading",
    href: "/listening",
    icons: [HeadphonesIcon, BookOpenIcon],
    banner: "bg-(--sp-lr-bg) text-(--sp-lr)",
    accent: "text-(--sp-lr)",
    facts: "200 câu · 120 phút · 10–990",
    description:
      "Trắc nghiệm Nghe & Đọc với Master Audio liên tục và ma trận 200 câu. Sắp ra mắt.",
  },
  {
    badge: "Speaking",
    name: "Speaking",
    href: "/speaking",
    icons: [MicIcon],
    banner: "bg-(--sp-speak-bg) text-(--sp-speak)",
    accent: "text-(--sp-speak)",
    facts: "11 câu · ~20 phút · 0–200",
    description:
      "Thu âm trực tiếp với hai pha Chuẩn bị / Nói. Đánh giá theo 5 tiêu chí.",
  },
  {
    badge: "Writing",
    name: "Writing",
    href: "/writing",
    icons: [PencilIcon],
    banner: "bg-(--sp-write-bg) text-(--sp-write)",
    accent: "text-(--sp-write)",
    facts: "8 câu · 60 phút · 0–200",
    description:
      "Viết câu theo tranh, phản hồi email và viết luận. Chặn dán nội dung bên ngoài.",
  },
];

const steps = [
  ["01", "Luyện từng Part", "Nắm chắc từng dạng câu hỏi trước khi làm đề."],
  ["02", "Thi thử có tính giờ", "Làm full test trong điều kiện như thi thật."],
  ["03", "Xem lại và cải thiện", "Đọc nhận xét, sửa điểm yếu rồi làm lại."],
];

const card = "rounded-[20px] border border-(--sp-line)/70 bg-white";
const sectionLink = `text-[15px] font-medium text-(--sp-brand) hover:underline ${focusRing}`;
const sectionTitle = "text-2xl font-bold leading-8";

export default async function Home(props: {
  searchParams?: Promise<{ profile?: string }>;
}) {
  const searchParams = await props.searchParams;
  const openProfile = searchParams?.profile === "1";

  return (
    <div className={`sp-theme min-h-dvh bg-white ${speakingFontClasses}`}>
      <header className="sticky top-0 z-30 border-b border-(--sp-line) bg-(--sp-surface)">
        <div
          className={`${wideContainer} flex min-h-16 flex-wrap items-center gap-x-10 gap-y-2 py-2`}
        >
          <SpeakingLogo />
          <nav
            aria-label="Kỹ năng"
            className="flex flex-wrap gap-x-7 gap-y-1 text-[15px]"
          >
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

      <main className={`${wideContainer} pb-8 pt-10`}>
        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="w-fit rounded-lg bg-(--sp-orange-soft) px-3 py-1.5 text-xs font-medium uppercase text-(--sp-brand)">
              4 kỹ năng · 3 bài thi độc lập
            </p>
            <h1 className="mt-5 text-[32px] font-bold leading-10 md:text-[44px] md:leading-[52px]">
              Hệ Thống Luyện Thi TOEIC Chuẩn Format ETS
            </h1>
            <p className="mt-4 max-w-2xl text-[17px] leading-6 text-(--sp-ink-2)">
              Phòng thi ảo theo đúng nhịp đề thật, AI chấm điểm Speaking &amp;
              Writing chi tiết. Ngân hàng đề 200 câu L&amp;R đang được hoàn
              thiện.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className={primaryAction} href="/speaking">
                Thi thử Speaking · ~20 phút
              </Link>
              <Link className={secondaryAction} href="/speaking/parts/1">
                Luyện tập theo từng Part
              </Link>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-(--sp-ink-2)">
              {promises.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          </div>

          <aside
            aria-label="Mục tiêu tiếp theo"
            className="relative min-w-0 rounded-3xl bg-(--sp-cream) p-7 md:p-9"
          >
            <SparklesIcon
              className="absolute right-7 top-7 text-(--sp-brand)"
              size={24}
            />
            <p className="text-xs font-medium uppercase text-(--sp-brand)">
              Your next milestone
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-6">
              <div className="grid size-[140px] shrink-0 place-content-center rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-center text-white">
                <span className="text-[40px] font-bold leading-[44px]">
                  900+
                </span>
                <span className="mt-1 text-[11px] uppercase">TOEIC goal</span>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold leading-8">
                  Từng bước tiến xa.
                </p>
                <p className="mt-2 text-[15px] leading-[22px] text-(--sp-ink-2)">
                  15 dạng bài chuyên sâu.
                  <br />
                  Một mục tiêu trong tầm tay.
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-(--sp-success-bg) px-2.5 py-1.5 text-[13px] text-(--sp-success)">
                  <TrendingUpIcon size={14} />
                  Học đều đặn, tiến bộ mỗi ngày
                </p>
              </div>
            </div>
            <nav
              aria-label="Kỹ năng trong lộ trình"
              className="mt-6 flex flex-wrap gap-x-8 gap-y-1"
            >
              {milestoneLinks.map((item) => (
                <Link
                  className={`text-[13px] font-medium text-(--sp-brand) hover:underline ${focusRing}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </section>

        <section aria-labelledby="home-skills" className="mt-12 scroll-mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className={sectionTitle} id="home-skills">
              Ba bài thi độc lập · Chọn mục tiêu của bạn
            </h2>
            <a className={sectionLink} href="#home-steps">
              Khám phá lộ trình →
            </a>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {exams.map((exam) => (
              <article
                className={`${card} flex flex-col p-6 transition hover:border-(--sp-hero-line) hover:shadow-(--sp-shadow-card)`}
                key={exam.name}
              >
                <span
                  className={`w-full max-w-[290px] rounded-sm px-3 py-1.5 text-[13px] font-medium ${exam.banner}`}
                >
                  {exam.badge}
                </span>
                <span className={`mt-4 flex gap-1 ${exam.accent}`}>
                  {exam.icons.map((Icon, index) => (
                    <Icon key={index} size={30} />
                  ))}
                </span>
                <h3 className="mt-3 text-xl font-semibold leading-7">
                  {exam.name}
                </h3>
                <p className={`mt-3 text-[13px] ${exam.accent}`}>
                  {exam.facts}
                </p>
                <p className="mt-3 flex-1 text-[15px] leading-[22px] text-(--sp-ink-2)">
                  {exam.description}
                </p>
                <Link
                  className={`mt-4 w-fit text-[15px] font-semibold text-(--sp-crimson-link) hover:underline ${focusRing}`}
                  href={exam.href}
                >
                  Xem danh sách đề →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="home-featured" className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className={sectionTitle} id="home-featured">
              Đề thi nổi bật
            </h2>
            <Link className={sectionLink} href="/speaking">
              Xem tất cả đề thi →
            </Link>
          </div>
          <FeaturedExams />
        </section>

        <section aria-labelledby="home-steps" className="mt-12">
          <h2 className={`${sectionTitle} scroll-mt-20`} id="home-steps">
            Lộ trình luyện thi
          </h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <li className={`${card} p-5`} key={number}>
                <span className="text-[13px] font-semibold text-(--sp-brand)">
                  {number}
                </span>
                <p className="mt-1 text-xl font-semibold leading-7">{title}</p>
                <p className="mt-2 text-[15px] text-(--sp-ink-2)">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px] text-(--sp-ink-2)">
          <p>© 2026 TOEICMaster. Học ngoại ngữ, mở ra thế giới.</p>
          <nav aria-label="Liên kết cuối trang" className="flex gap-6">
            <Link
              className={`hover:underline ${focusRing}`}
              href="/history/writing"
            >
              Lịch sử học tập
            </Link>
            <Link
              className={`hover:underline ${focusRing}`}
              href="/admin/content/writing"
            >
              Khu vực quản trị
            </Link>
          </nav>
        </footer>
        <ConnectionStatus />
      </main>
      <GuideMascot />
    </div>
  );
}
