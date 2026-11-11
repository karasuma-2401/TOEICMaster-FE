import { UserMenu } from "@/features/user/components/user-menu";
import { SkillHeader } from "@/shared/components/practice/skill-header";

export function SpeakingHeader({ wide }: { wide?: boolean }) {
  return <SkillHeader account={<UserMenu />} active="speaking" wide={wide} />;
}
