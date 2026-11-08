import { UserMenu } from "@/features/user/components/user-menu";
import { SkillHeader } from "@/shared/components/practice/skill-header";

export function SpeakingHeader() {
  return <SkillHeader account={<UserMenu />} active="speaking" />;
}
