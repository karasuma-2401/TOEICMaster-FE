import { AttemptHistorySection } from "@/features/history/components/attempt-history-section";
import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";
import { UserMenu } from "@/features/user/components/user-menu";
import { Breadcrumbs } from "@/shared/components/practice/breadcrumbs";
import { SkillHeader } from "@/shared/components/practice/skill-header";
import { wideContainer } from "@/shared/components/practice/styles";

export default function HistoryPage() {
  return (
    <div className={`sp-font ${speakingFontClasses} min-h-dvh bg-[#faf7f5]`}>
      <SkillHeader active="history" account={<UserMenu />} />
      <main className={`${wideContainer} py-8`} id="main-content" tabIndex={-1}>
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "History" }]}
        />
        <header className="mt-4">
          <h1 className="text-[28px] font-bold leading-9 text-[#2f2b28]">
            Attempt History
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#6b655f]">
            All your Listening &amp; Reading, Speaking, and Writing attempts,
            newest first.
          </p>
        </header>
        <AttemptHistorySection
          limit={9}
          showChart
          showFilter
          showSummary
          skills={["lr", "speaking", "writing"]}
        />
      </main>
    </div>
  );
}
