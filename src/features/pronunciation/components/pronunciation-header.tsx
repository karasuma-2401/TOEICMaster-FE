import { UserMenu } from "@/features/user/components/user-menu";
import { SkillHeader } from "@/shared/components/practice/skill-header";

export function PronunciationHeader() {
  return <SkillHeader account={<UserMenu />} active="pronunciation" wide />;
}
