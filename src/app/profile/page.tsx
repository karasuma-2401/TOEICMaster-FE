import { speakingFontClasses } from "@/features/speaking/fonts";
import "@/features/speaking/speaking-theme.css";
import { ProfilePanel } from "@/features/user/components/profile-panel";
import { UserMenu } from "@/features/user/components/user-menu";
import { SkillHeader } from "@/shared/components/practice/skill-header";

export default function ProfilePage() {
  return (
    <div className={`sp-font ${speakingFontClasses} min-h-dvh bg-[#f7f6f4]`}>
      <SkillHeader account={<UserMenu />} />
      <main className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8">
        <ProfilePanel />
      </main>
    </div>
  );
}
