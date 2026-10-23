import { UserMenu } from "@/features/user/components/user-menu";
import {
  SkillHeader,
  type PracticeNavId,
} from "@/shared/components/practice/skill-header";

export function WritingHeader({
  active = "writing",
}: {
  active?: Extract<PracticeNavId, "writing" | "history">;
}) {
  return <SkillHeader account={<UserMenu />} active={active} />;
}
